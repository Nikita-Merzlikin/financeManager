import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import {
  AccountDto,
  CreateAccountDto,
  UpdateAccountDto,
} from "src/core/dto/finance.dto";
import {
  AccountSource,
  AccountType,
} from "src/core/enums/finance.enums";
import { Account } from "src/db/dbModels/Account";
import {
  formatMinorUnits,
  fromMinorUnits,
  toMinorUnits,
} from "./finance.utils";

@Injectable()
export class AccountsService {
  constructor(
    @InjectModel(Account)
    private readonly accountModel: typeof Account,
  ) {}

  toDto(account: Account): AccountDto {
    return {
      id: account.id,
      name: account.name,
      source: account.source,
      type: account.type,
      currency: account.currency,
      balance: fromMinorUnits(account.balance),
      iban: account.iban,
      isActive: account.isActive,
      bankConnectionId: account.bankConnectionId,
    };
  }

  async list(userId: string): Promise<AccountDto[]> {
    const accounts = await this.accountModel.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
    });
    return accounts.map((item) => this.toDto(item));
  }

  async create(userId: string, dto: CreateAccountDto): Promise<AccountDto> {
    const account = await this.accountModel.create({
      userId,
      name: dto.name,
      type: dto.type ?? AccountType.CARD,
      currency: dto.currency ?? "UAH",
      balance: formatMinorUnits(toMinorUnits(dto.balance ?? 0)),
      source: AccountSource.MANUAL,
      iban: dto.iban ?? null,
      isActive: true,
    });
    return this.toDto(account);
  }

  async update(
    userId: string,
    accountId: string,
    dto: UpdateAccountDto,
  ): Promise<AccountDto> {
    const account = await this.findOwned(userId, accountId);
    await account.update({
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.type !== undefined && { type: dto.type }),
      ...(dto.balance !== undefined && {
        balance: formatMinorUnits(toMinorUnits(dto.balance)),
      }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.iban !== undefined && { iban: dto.iban }),
    });
    return this.toDto(account);
  }

  async remove(userId: string, accountId: string): Promise<{ message: string }> {
    const account = await this.findOwned(userId, accountId);
    if (account.source !== AccountSource.MANUAL) {
      throw new ForbiddenException("Bank accounts can only be disconnected");
    }
    await account.destroy();
    return { message: "Account deleted" };
  }

  async findOwned(userId: string, accountId: string): Promise<Account> {
    const account = await this.accountModel.findByPk(accountId);
    if (!account || account.userId !== userId) {
      throw new NotFoundException("Account not found");
    }
    return account;
  }
}
