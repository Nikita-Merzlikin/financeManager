import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { FINANCE_ERROR_MESSAGES } from "src/core/constants/finance-errors.constants";
import {
  CreateTransactionDto,
  TransactionDto,
  UpdateTransactionDto,
} from "src/core/dto/finance.dto";
import {
  AccountSource,
  TransactionType,
} from "src/core/enums/finance.enums";
import { Account } from "src/db/dbModels/Account";
import { Category } from "src/db/dbModels/Category";
import { Transaction } from "src/db/dbModels/Transaction";
import { AccountsService } from "./accounts.service";
import {
  addMinor,
  formatMinorUnits,
  parseMinorUnits,
  subMinor,
  toMinorUnits,
} from "./finance.utils";

@Injectable()
export class TransactionsService {
  constructor(
    @InjectModel(Transaction)
    private readonly transactionModel: typeof Transaction,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    private readonly accountsService: AccountsService,
  ) {}

  toDto(tx: Transaction): TransactionDto {
    return tx.toDto();
  }

  async list(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<TransactionDto[]> {
    const where: Record<string, unknown> = { userId };
    if (from || to) {
      where.occurredAt = {
        ...(from ? { [Op.gte]: new Date(from) } : {}),
        ...(to ? { [Op.lte]: new Date(to) } : {}),
      };
    }

    const items = await this.transactionModel.findAll({
      where,
      order: [["occurredAt", "DESC"]],
    });
    return items.map((item) => item.toDto());
  }

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    const account = await this.accountsService.findOwned(userId, dto.accountId);
    if (dto.categoryId) {
      await this.assertCategory(userId, dto.categoryId, dto.type);
    }

    const amountMinor = toMinorUnits(dto.amount);
    const tx = await this.transactionModel.create({
      userId,
      accountId: account.id,
      categoryId: dto.categoryId ?? null,
      type: dto.type,
      amount: formatMinorUnits(amountMinor),
      currency: dto.currency ?? account.currency,
      description: dto.description ?? null,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      source: AccountSource.MANUAL,
    });

    await this.applyBalanceDelta(account, dto.type, amountMinor);
    return tx.toDto();
  }

  async update(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    const tx = await this.findOwned(userId, transactionId);
    if (tx.source !== AccountSource.MANUAL) {
      throw new BadRequestException(
        FINANCE_ERROR_MESSAGES.ONLY_MANUAL_TX_EDIT,
      );
    }

    const account = await this.accountsService.findOwned(userId, tx.accountId);
    const oldAmount = parseMinorUnits(tx.amount);
    await this.applyBalanceDelta(
      account,
      tx.type === TransactionType.INCOME
        ? TransactionType.EXPENSE
        : TransactionType.INCOME,
      oldAmount,
    );

    const nextType = dto.type ?? tx.type;
    const nextAmount =
      dto.amount !== undefined ? toMinorUnits(dto.amount) : oldAmount;

    if (dto.categoryId) {
      await this.assertCategory(userId, dto.categoryId, nextType);
    }

    await tx.update({
      ...dto,
      ...(dto.amount !== undefined && {
        amount: formatMinorUnits(toMinorUnits(dto.amount)),
      }),
      ...(dto.occurredAt !== undefined && {
        occurredAt: new Date(dto.occurredAt),
      }),
    });

    await this.applyBalanceDelta(account, nextType, nextAmount);
    return tx.toDto();
  }

  async remove(
    userId: string,
    transactionId: string,
  ): Promise<{ message: string }> {
    const tx = await this.findOwned(userId, transactionId);
    if (tx.source !== AccountSource.MANUAL) {
      throw new BadRequestException(
        FINANCE_ERROR_MESSAGES.ONLY_MANUAL_TX_DELETE,
      );
    }
    const account = await this.accountsService.findOwned(userId, tx.accountId);
    await this.applyBalanceDelta(
      account,
      tx.type === TransactionType.INCOME
        ? TransactionType.EXPENSE
        : TransactionType.INCOME,
      parseMinorUnits(tx.amount),
    );
    await tx.destroy();
    return { message: FINANCE_ERROR_MESSAGES.TRANSACTION_DELETED };
  }

  private async findOwned(
    userId: string,
    transactionId: string,
  ): Promise<Transaction> {
    const tx = await this.transactionModel.findByPk(transactionId);
    if (!tx || tx.userId !== userId) {
      throw new NotFoundException(FINANCE_ERROR_MESSAGES.TRANSACTION_NOT_FOUND);
    }
    return tx;
  }

  private async assertCategory(
    userId: string,
    categoryId: string,
    type: TransactionType,
  ): Promise<void> {
    const category = await this.categoryModel.findByPk(categoryId);
    if (
      !category ||
      (category.userId && category.userId !== userId) ||
      category.type !== type
    ) {
      throw new BadRequestException(FINANCE_ERROR_MESSAGES.INVALID_CATEGORY);
    }
  }

  private async applyBalanceDelta(
    account: Account,
    type: TransactionType,
    amountMinor: bigint,
  ): Promise<void> {
    const next =
      type === TransactionType.INCOME
        ? addMinor(account.balance, amountMinor)
        : subMinor(account.balance, amountMinor);
    await account.update({ balance: formatMinorUnits(next) });
  }
}
