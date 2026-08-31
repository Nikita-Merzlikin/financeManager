import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { FINANCE_ERROR_MESSAGES } from "src/core/constants/finance-errors.constants";
import {
  AccountDto,
  CreateAccountDto,
  UpdateAccountDto,
} from "src/core/dto/finance.dto";
import {
  AccountSource,
  DEFAULT_ACCOUNT_TYPE,
  DEFAULT_CURRENCY,
} from "src/core/enums/finance.enums";
import { Account } from "src/db/dbModels/Account";
import { Transaction } from "src/db/dbModels/Transaction";
import {
  formatMinorUnits,
  toMinorUnits,
} from "./finance.utils";

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account)
    private readonly accountModel: typeof Account,
    @InjectModel(Transaction)
    private readonly transactionModel: typeof Transaction,
  ) {}

  toDto(account: Account): AccountDto {
    return account.toDto();
  }

  async list(userId: string): Promise<AccountDto[]> {
    const accounts = await this.accountModel.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    return accounts.map((item) => item.toDto());
  }

  async create(userId: string, dto: CreateAccountDto): Promise<AccountDto> {
    const account = await this.accountModel.create({
      userId,
      name: dto.name,
      type: dto.type ?? DEFAULT_ACCOUNT_TYPE,
      currency: dto.currency ?? DEFAULT_CURRENCY,
      balance: formatMinorUnits(toMinorUnits(dto.balance ?? 0)),
      source: AccountSource.MANUAL,
      iban: dto.iban ?? null,
      isActive: true,
    });
    return account.toDto();
  }

  async update(
    userId: string,
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<AccountDto> {
    const account = await this.findOwned(userId, accountId);
    await account.update({
      ...dto,
      ...(dto.balance !== undefined && {
        balance: formatMinorUnits(toMinorUnits(dto.balance)),
      }),
    });
    return account.toDto();
  }

  async remove(userId: string, accountId: string): Promise<{ message: string }> {
    const account = await this.findOwned(userId, accountId);
    if (account.source !== AccountSource.MANUAL) {
      throw new ForbiddenException(
        FINANCE_ERROR_MESSAGES.BANK_ACCOUNTS_ONLY_DISCONNECT,
      );
    }

    const sequelize = this.accountModel.sequelize;
    if (sequelize) {
      await sequelize.transaction(async (transaction) => {
        await this.transactionModel.destroy({
          where: { accountId: account.id, userId },
          transaction,
        });
        await account.destroy({ transaction });
      });
    } else {
      await this.transactionModel.destroy({
        where: { accountId: account.id, userId },
      });
      await account.destroy();
    }

    return { message: FINANCE_ERROR_MESSAGES.ACCOUNT_DELETED };
  }

  async findOwned(userId: string, accountId: string): Promise<Account> {
    const account = await this.accountModel.findByPk(accountId);
    if (!account || account.userId !== userId) {
      throw new NotFoundException(FINANCE_ERROR_MESSAGES.ACCOUNT_NOT_FOUND);
    }
    return account;
  }
}
