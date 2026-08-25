import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import {
  CreateTransactionDto,
  TransactionDto,
  UpdateTransactionDto,
} from "src/core/dto/finance.dto";
import { Account } from "src/db/dbModels/Account";
import { Category } from "src/db/dbModels/Category";
import { Transaction } from "src/db/dbModels/Transaction";
import { AccountsService } from "./accounts.service";
import { formatMoney, toMoney } from "./finance.utils";

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
    return {
      id: tx.id,
      accountId: tx.accountId,
      categoryId: tx.categoryId,
      type: tx.type,
      amount: toMoney(tx.amount),
      currency: tx.currency,
      description: tx.description,
      occurredAt: tx.occurredAt,
      source: tx.source,
    };
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
    return items.map((item) => this.toDto(item));
  }

  async create(
    userId: string,
    dto: CreateTransactionDto,
  ): Promise<TransactionDto> {
    const account = await this.accountsService.findOwned(userId, dto.accountId);
    if (dto.categoryId) {
      await this.assertCategory(userId, dto.categoryId, dto.type);
    }

    const amount = toMoney(dto.amount);
    const tx = await this.transactionModel.create({
      userId,
      accountId: account.id,
      categoryId: dto.categoryId ?? null,
      type: dto.type,
      amount: formatMoney(amount),
      currency: dto.currency ?? account.currency,
      description: dto.description ?? null,
      occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
      source: "manual",
    });

    await this.applyBalanceDelta(account, dto.type, amount);
    return this.toDto(tx);
  }

  async update(
    userId: string,
    transactionId: string,
    dto: UpdateTransactionDto,
  ): Promise<TransactionDto> {
    const tx = await this.findOwned(userId, transactionId);
    if (tx.source !== "manual") {
      throw new BadRequestException("Only manual transactions can be edited");
    }

    const account = await this.accountsService.findOwned(userId, tx.accountId);
    const oldAmount = toMoney(tx.amount);
    await this.applyBalanceDelta(
      account,
      tx.type === "income" ? "expense" : "income",
      oldAmount,
    );

    const nextType = dto.type ?? tx.type;
    const nextAmount = dto.amount !== undefined ? toMoney(dto.amount) : oldAmount;

    if (dto.categoryId) {
      await this.assertCategory(userId, dto.categoryId, nextType);
    }

    await tx.update({
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.amount !== undefined && { amount: formatMoney(dto.amount) }),
      ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.occurredAt !== undefined && {
        occurredAt: new Date(dto.occurredAt),
      }),
    });

    await this.applyBalanceDelta(account, nextType, nextAmount);
    return this.toDto(tx);
  }

  async remove(
    userId: string,
    transactionId: string,
  ): Promise<{ message: string }> {
    const tx = await this.findOwned(userId, transactionId);
    if (tx.source !== "manual") {
      throw new BadRequestException("Only manual transactions can be deleted");
    }
    const account = await this.accountsService.findOwned(userId, tx.accountId);
    await this.applyBalanceDelta(
      account,
      tx.type === "income" ? "expense" : "income",
      toMoney(tx.amount),
    );
    await tx.destroy();
    return { message: "Transaction deleted" };
  }

  private async findOwned(
    userId: string,
    transactionId: string,
  ): Promise<Transaction> {
    const tx = await this.transactionModel.findByPk(transactionId);
    if (!tx || tx.userId !== userId) {
      throw new NotFoundException("Transaction not found");
    }
    return tx;
  }

  private async assertCategory(
    userId: string,
    categoryId: string,
    type: "income" | "expense",
  ): Promise<void> {
    const category = await this.categoryModel.findByPk(categoryId);
    if (
      !category ||
      (category.userId && category.userId !== userId) ||
      category.type !== type
    ) {
      throw new BadRequestException("Invalid category");
    }
  }

  private async applyBalanceDelta(
    account: Account,
    type: "income" | "expense",
    amount: number,
  ): Promise<void> {
    const current = toMoney(account.balance);
    const next = type === "income" ? current + amount : current - amount;
    await account.update({ balance: formatMoney(next) });
  }
}
