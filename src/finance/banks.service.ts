import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import {
  ConnectMonobankDto,
  ConnectPrivatDto,
  SyncBankDto,
  BankConnectionResponseDto,
} from "src/core/dto/finance.dto";
import { FINANCE_ERROR_MESSAGES } from "src/core/constants/finance-errors.constants";
import {
  AccountSource,
  BankProvider,
  TransactionType,
} from "src/core/enums/finance.enums";
import { Account } from "src/db/dbModels/Account";
import { BankConnection } from "src/db/dbModels/BankConnection";
import { Transaction } from "src/db/dbModels/Transaction";
import type {
  BankAccountData,
  BankTransactionData,
} from "./banks/bank.interface";
import { BankFactory } from "./banks/bank.factory";
import { buildMonobankExternalId } from "./banks/bank-external-id";
import { MonobankClient } from "./banks/monobank.client";
import type { MonoWebhookPayload } from "./banks/monobank.types";
import { formatMinorUnits } from "./finance.utils";

@Injectable()
export class BanksService {
  constructor(
    @InjectModel(BankConnection)
    private readonly bankConnectionModel: typeof BankConnection,
    @InjectModel(Account)
    private readonly accountModel: typeof Account,
    @InjectModel(Transaction)
    private readonly transactionModel: typeof Transaction,
    private readonly bankFactory: BankFactory,
    private readonly monobankClient: MonobankClient,
  ) {}

  async connectMonobank(
    userId: string,
    dto: ConnectMonobankDto,
  ): Promise<BankConnectionResponseDto> {
    const credentialsJson = JSON.stringify({ token: dto.token });
    const bank = this.bankFactory.get(BankProvider.MONOBANK);
    const result = await bank.connect(credentialsJson, dto.label);

    const [connection] = await this.bankConnectionModel.findOrCreate({
      where: { userId, provider: BankProvider.MONOBANK, isActive: true },
      defaults: {
        userId,
        provider: BankProvider.MONOBANK,
        credentialsEncrypted: credentialsJson,
        label: dto.label ?? result.label,
        isActive: true,
      },
    });

    await connection.update({
      credentialsEncrypted: credentialsJson,
      label: dto.label ?? connection.label ?? result.label,
      isActive: true,
    });

    for (const accountData of result.accounts) {
      await this.upsertAccount(userId, connection.id, accountData);
    }

    await connection.update({ lastSyncedAt: new Date() });
    return connection.toDto("Connected");
  }

  async connectPrivat(
    userId: string,
    dto: ConnectPrivatDto,
  ): Promise<BankConnectionResponseDto> {
    const credentialsJson = JSON.stringify({
      clientId: dto.clientId,
      token: dto.token,
      iban: dto.iban,
    });
    const bank = this.bankFactory.get(BankProvider.PRIVAT);
    const result = await bank.connect(credentialsJson, dto.label);

    const [connection] = await this.bankConnectionModel.findOrCreate({
      where: { userId, provider: BankProvider.PRIVAT, isActive: true },
      defaults: {
        userId,
        provider: BankProvider.PRIVAT,
        credentialsEncrypted: credentialsJson,
        label: dto.label ?? result.label,
        isActive: true,
      },
    });

    await connection.update({
      credentialsEncrypted: credentialsJson,
      label: dto.label ?? connection.label ?? result.label,
      isActive: true,
    });

    await this.syncConnection(userId, connection, 30);
    return connection.toDto("Connected and synced");
  }

  async listConnections(userId: string): Promise<BankConnectionResponseDto[]> {
    const items = await this.bankConnectionModel.findAll({
      where: { userId, isActive: true },
      order: [["createdAt", "DESC"]],
    });
    return items.map((item) => item.toDto());
  }

  async sync(
    userId: string,
    connectionId: string,
    dto: SyncBankDto,
  ): Promise<BankConnectionResponseDto> {
    const connection = await this.findOwned(userId, connectionId);
    const days = Math.min(Math.max(dto.days ?? 30, 1), 90);
    await this.syncConnection(userId, connection, days);
    return connection.toDto("Synced successfully");
  }

  async disconnect(userId: string, connectionId: string) {
    const connection = await this.findOwned(userId, connectionId);
    await connection.update({ isActive: false });
    await this.accountModel.update(
      { isActive: false },
      { where: { userId, bankConnectionId: connection.id } },
    );
    return { message: FINANCE_ERROR_MESSAGES.BANK_CONNECTION_DISCONNECTED };
  }

  async handleMonobankWebhook(payload: MonoWebhookPayload) {
    if (payload.type !== "StatementItem" || !payload.data?.statementItem) {
      return { message: "ignored" };
    }

    const externalAccountId = payload.data.account;
    const item = payload.data.statementItem;
    if (!externalAccountId) return { message: "ignored" };

    const account = await this.accountModel.findOne({
      where: {
        source: AccountSource.MONOBANK,
        externalId: externalAccountId,
        isActive: true,
      },
    });
    if (!account)
      return { message: FINANCE_ERROR_MESSAGES.MONOBANK_ACCOUNT_NOT_FOUND };

    await this.upsertBankTransaction(account.userId, account.id, {
      source: AccountSource.MONOBANK,
      externalId: buildMonobankExternalId(item.id),
      amountMinor: this.monobankClient.toMinorAmount(item.amount),
      type: item.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
      currency: this.monobankClient.mapCurrency(item.currencyCode),
      description: item.comment || item.description,
      occurredAt: new Date(item.time * 1000),
      mcc: item.mcc,
    });

    if (typeof item.balance === "number") {
      await account.update({
        balance: formatMinorUnits(
          this.monobankClient.toMinorAmount(item.balance),
        ),
      });
    }

    return { message: "ok" };
  }

  private async syncConnection(
    userId: string,
    connection: BankConnection,
    days: number,
  ) {
    const bank = this.bankFactory.get(connection.provider);
    const result = await bank.sync(
      connection.credentialsEncrypted,
      days,
      connection.label,
    );

    for (const accountData of result.accounts) {
      await this.upsertAccount(userId, connection.id, accountData);
    }

    for (const [externalId, txs] of result.transactions) {
      const account = await this.accountModel.findOne({
        where: { userId, externalId },
      });
      if (!account) continue;

      for (const tx of txs) {
        await this.upsertBankTransaction(userId, account.id, tx);
      }
    }

    await connection.update({ lastSyncedAt: new Date() });
  }

  private async upsertAccount(
    userId: string,
    bankConnectionId: string,
    data: BankAccountData,
  ) {
    const balance = formatMinorUnits(data.balanceMinor);
    const [account] = await this.accountModel.findOrCreate({
      where: {
        userId,
        source: data.source,
        externalId: data.externalId,
      },
      defaults: {
        userId,
        bankConnectionId,
        source: data.source,
        externalId: data.externalId,
        name: data.name,
        type: data.type,
        currency: data.currency,
        balance,
        iban: data.iban,
        isActive: true,
      },
    });

    await account.update({
      bankConnectionId,
      name: data.name,
      type: data.type,
      currency: data.currency,
      balance,
      iban: data.iban,
      isActive: true,
    });

    return account;
  }

  private async upsertBankTransaction(
    userId: string,
    accountId: string,
    data: BankTransactionData,
  ) {
    const amount = formatMinorUnits(data.amountMinor);
    const existing = await this.transactionModel.findOne({
      where: { externalId: data.externalId },
    });
    if (existing) {
      await existing.update({
        description: data.description,
        amount,
        type: data.type,
        occurredAt: data.occurredAt,
        mcc: data.mcc,
      });
      return;
    }

    await this.transactionModel.create({
      userId,
      accountId,
      categoryId: null,
      type: data.type,
      amount,
      currency: data.currency,
      description: data.description,
      occurredAt: data.occurredAt,
      source: data.source,
      externalId: data.externalId,
      mcc: data.mcc,
    });
  }

  private async findOwned(userId: string, connectionId: string) {
    const connection = await this.bankConnectionModel.findByPk(connectionId);
    if (!connection || connection.userId !== userId || !connection.isActive) {
      throw new NotFoundException(
        FINANCE_ERROR_MESSAGES.BANK_CONNECTION_NOT_FOUND,
      );
    }
    return connection;
  }
}
