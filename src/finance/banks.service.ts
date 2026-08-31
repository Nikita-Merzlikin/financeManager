import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import dayjs from "dayjs";
import {
  ConnectMonobankDto,
  ConnectPrivatDto,
  SyncBankDto,
  BankConnectionResponseDto,
} from "src/core/dto/finance.dto";
import { FINANCE_ERROR_MESSAGES } from "src/core/constants/finance-errors.constants";
import {
  AccountSource,
  AccountType,
  BankProvider,
  DEFAULT_CURRENCY,
  MONOBANK_DEFAULT_LABEL,
  PRIVAT_CREDIT_TYPES,
  PRIVAT_DEFAULT_ACCOUNT_LABEL,
  PRIVAT_DEFAULT_TX_DESCRIPTION,
  TransactionType,
} from "src/core/enums/finance.enums";
import { Account } from "src/db/dbModels/Account";
import { BankConnection } from "src/db/dbModels/BankConnection";
import { Transaction } from "src/db/dbModels/Transaction";
import {
  MonoCredentials,
  PrivatCredentials,
} from "./banks/bank-credentials.types";
import {
  buildMonobankExternalId,
  buildPrivatExternalId,
  normalizeIban,
} from "./banks/bank-external-id";
import { MonobankClient } from "./banks/monobank.client";
import type {
  MonoClientInfo,
  MonoWebhookPayload,
} from "./banks/monobank.types";
import {
  PrivatBalanceRow,
  PrivatClient,
} from "./banks/privat.client";
import {
  formatMinorUnits,
  parseCredentials,
  toMinorUnits,
} from "./finance.utils";

@Injectable()
export class BanksService {
  constructor(
    @InjectModel(BankConnection)
    private readonly bankConnectionModel: typeof BankConnection,
    @InjectModel(Account)
    private readonly accountModel: typeof Account,
    @InjectModel(Transaction)
    private readonly transactionModel: typeof Transaction,
    private readonly monobankClient: MonobankClient,
    private readonly privatClient: PrivatClient,
  ) {}

  async connectMonobank(
    userId: string,
    dto: ConnectMonobankDto,
  ): Promise<BankConnectionResponseDto> {
    const info = await this.monobankClient.getClientInfo(dto.token);
    const [connection] = await this.bankConnectionModel.findOrCreate({
      where: { userId, provider: BankProvider.MONOBANK, isActive: true },
      defaults: {
        userId,
        provider: BankProvider.MONOBANK,
        credentialsEncrypted: JSON.stringify({ token: dto.token }),
        label: dto.label ?? info.name ?? MONOBANK_DEFAULT_LABEL,
        isActive: true,
      },
    });

    await connection.update({
      credentialsEncrypted: JSON.stringify({ token: dto.token }),
      label: dto.label ?? connection.label ?? info.name ?? MONOBANK_DEFAULT_LABEL,
      isActive: true,
    });

    await this.importMonobankAccounts(userId, connection, info);
    await connection.update({ lastSyncedAt: new Date() });

    return connection.toDto("Connected");
  }

  async connectPrivat(
    userId: string,
    dto: ConnectPrivatDto,
  ): Promise<BankConnectionResponseDto> {
    await this.privatClient.getBalance(dto.clientId, dto.token, dto.iban);

    const credentials = JSON.stringify({
      clientId: dto.clientId,
      token: dto.token,
      iban: dto.iban,
    });

    const [connection] = await this.bankConnectionModel.findOrCreate({
      where: { userId, provider: BankProvider.PRIVAT, isActive: true },
      defaults: {
        userId,
        provider: BankProvider.PRIVAT,
        credentialsEncrypted: credentials,
        label: dto.label ?? PRIVAT_DEFAULT_ACCOUNT_LABEL,
        isActive: true,
      },
    });

    await connection.update({
      credentialsEncrypted: credentials,
      label: dto.label ?? connection.label ?? PRIVAT_DEFAULT_ACCOUNT_LABEL,
      isActive: true,
    });

    await this.syncPrivat(userId, connection, 30);
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

    if (connection.provider === BankProvider.MONOBANK) {
      await this.syncMonobank(userId, connection, days);
    } else {
      await this.syncPrivat(userId, connection, days);
    }

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
    if (!account) return { message: FINANCE_ERROR_MESSAGES.MONOBANK_ACCOUNT_NOT_FOUND };

    await this.upsertBankTransaction({
      userId: account.userId,
      accountId: account.id,
      source: AccountSource.MONOBANK,
      externalId: buildMonobankExternalId(item.id),
      amountMinor: this.monobankClient.toMinorAmount(item.amount),
      type:
        item.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
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

  private async importMonobankAccounts(
    userId: string,
    connection: BankConnection,
    info: MonoClientInfo,
  ) {
    for (const monoAccount of info.accounts ?? []) {
      await this.upsertAccount({
        userId,
        bankConnectionId: connection.id,
        source: AccountSource.MONOBANK,
        externalId: monoAccount.id,
        name: `${monoAccount.type} ${monoAccount.maskedPan?.[0] ?? ""}`.trim(),
        type:
          monoAccount.type === "fop" ? AccountType.FOP : AccountType.CARD,
        currency: this.monobankClient.mapCurrency(monoAccount.currencyCode),
        balanceMinor: this.monobankClient.toMinorAmount(monoAccount.balance),
        iban: monoAccount.iban ?? null,
      });
    }

    for (const jar of info.jars ?? []) {
      await this.upsertAccount({
        userId,
        bankConnectionId: connection.id,
        source: AccountSource.MONOBANK,
        externalId: jar.id,
        name: jar.title,
        type: AccountType.JAR,
        currency: this.monobankClient.mapCurrency(jar.currencyCode),
        balanceMinor: this.monobankClient.toMinorAmount(jar.balance),
        iban: null,
      });
    }
  }

  private async syncMonobank(
    userId: string,
    connection: BankConnection,
    days: number,
  ) {
    const credentials = parseCredentials<MonoCredentials>(
      connection.credentialsEncrypted,
    );
    const info = await this.monobankClient.getClientInfo(credentials.token);
    await this.importMonobankAccounts(userId, connection, info);

    const syncDays = Math.min(days, 31);
    const to = Math.floor(Date.now() / 1000);
    const from = to - syncDays * 24 * 60 * 60;
    const monoAccounts = info.accounts ?? [];

    for (let i = 0; i < monoAccounts.length; i++) {
      await delay(61_000);
      const monoAccount = monoAccounts[i];
      const account = await this.accountModel.findOne({
        where: {
          userId,
          source: AccountSource.MONOBANK,
          externalId: monoAccount.id,
        },
      });
      if (!account) continue;

      const items = await this.monobankClient.getStatement(
        credentials.token,
        monoAccount.id,
        from,
        to,
      );

      for (const item of items) {
        await this.upsertBankTransaction({
          userId,
          accountId: account.id,
          source: AccountSource.MONOBANK,
          externalId: buildMonobankExternalId(item.id),
          amountMinor: this.monobankClient.toMinorAmount(item.amount),
          type:
            item.amount >= 0
              ? TransactionType.INCOME
              : TransactionType.EXPENSE,
          currency: this.monobankClient.mapCurrency(item.currencyCode),
          description: item.comment || item.description,
          occurredAt: new Date(item.time * 1000),
          mcc: item.mcc,
        });
      }
    }

    await connection.update({ lastSyncedAt: new Date() });
  }

  private async syncPrivat(
    userId: string,
    connection: BankConnection,
    days: number,
  ) {
    const credentials = parseCredentials<PrivatCredentials>(
      connection.credentialsEncrypted,
    );
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    const startDate = this.privatClient.formatDate(from);
    const endDate = this.privatClient.formatDate(to);

    const balances = await this.privatClient.getBalance(
      credentials.clientId,
      credentials.token,
      credentials.iban,
      startDate,
      endDate,
    );
    const balanceRow = pickPrivatBalance(balances, credentials.iban);
    const balanceMajor = Number(
      balanceRow?.BALANCEOUT ?? balanceRow?.balance ?? 0,
    );
    const currency =
      balanceRow?.CCY || balanceRow?.currency || DEFAULT_CURRENCY;

    const account = await this.upsertAccount({
      userId,
      bankConnectionId: connection.id,
      source: AccountSource.PRIVAT,
      externalId: credentials.iban,
      name: connection.label || PRIVAT_DEFAULT_ACCOUNT_LABEL,
      type: AccountType.FOP,
      currency,
      balanceMinor: toMinorUnits(balanceMajor),
      iban: credentials.iban,
    });

    const rows = await this.privatClient.getTransactions(
      credentials.clientId,
      credentials.token,
      credentials.iban,
      startDate,
      endDate,
    );

    for (const row of rows) {
      const amountMajor = Math.abs(Number(row.SUM ?? row.AMOUNT ?? 0));
      if (!amountMajor) continue;
      const amountMinor = toMinorUnits(amountMajor);
      const tranType = (row.TRANTYPE || "").toUpperCase();
      const type = PRIVAT_CREDIT_TYPES.has(tranType)
        ? TransactionType.INCOME
        : TransactionType.EXPENSE;

      await this.upsertBankTransaction({
        userId,
        accountId: account.id,
        source: AccountSource.PRIVAT,
        externalId: buildPrivatExternalId(row, credentials.iban, amountMinor),
        amountMinor,
        type,
        currency: row.CCY || row.currency || currency,
        description:
          row.OSND || row.PURPOSE || PRIVAT_DEFAULT_TX_DESCRIPTION,
        occurredAt: parsePrivatDate(row.DAT_OD) ?? new Date(),
        mcc: null,
      });
    }

    await connection.update({ lastSyncedAt: new Date() });
  }

  private async upsertAccount(input: {
    userId: string;
    bankConnectionId: string;
    source: AccountSource.MONOBANK | AccountSource.PRIVAT;
    externalId: string;
    name: string;
    type: AccountType;
    currency: string;
    balanceMinor: bigint;
    iban: string | null;
  }) {
    const balance = formatMinorUnits(input.balanceMinor);
    const [account] = await this.accountModel.findOrCreate({
      where: {
        userId: input.userId,
        source: input.source,
        externalId: input.externalId,
      },
      defaults: {
        userId: input.userId,
        bankConnectionId: input.bankConnectionId,
        source: input.source,
        externalId: input.externalId,
        name: input.name,
        type: input.type,
        currency: input.currency,
        balance,
        iban: input.iban,
        isActive: true,
      },
    });

    await account.update({
      bankConnectionId: input.bankConnectionId,
      name: input.name,
      type: input.type,
      currency: input.currency,
      balance,
      iban: input.iban,
      isActive: true,
    });

    return account;
  }

  private async upsertBankTransaction(input: {
    userId: string;
    accountId: string;
    source: AccountSource.MONOBANK | AccountSource.PRIVAT;
    externalId: string;
    amountMinor: bigint;
    type: TransactionType;
    currency: string;
    description: string;
    occurredAt: Date;
    mcc: number | null;
  }) {
    const amount = formatMinorUnits(input.amountMinor);
    const existing = await this.transactionModel.findOne({
      where: { externalId: input.externalId },
    });
    if (existing) {
      await existing.update({
        description: input.description,
        amount,
        type: input.type,
        occurredAt: input.occurredAt,
        mcc: input.mcc,
      });
      return;
    }

    await this.transactionModel.create({
      userId: input.userId,
      accountId: input.accountId,
      categoryId: null,
      type: input.type,
      amount,
      currency: input.currency,
      description: input.description,
      occurredAt: input.occurredAt,
      source: input.source,
      externalId: input.externalId,
      mcc: input.mcc,
    });
  }

  private async findOwned(userId: string, connectionId: string) {
    const connection = await this.bankConnectionModel.findByPk(connectionId);
    if (!connection || connection.userId !== userId || !connection.isActive) {
      throw new NotFoundException(FINANCE_ERROR_MESSAGES.BANK_CONNECTION_NOT_FOUND);
    }
    return connection;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pickPrivatBalance(
  rows: PrivatBalanceRow[],
  iban: string,
): PrivatBalanceRow | undefined {
  if (!rows.length) return undefined;
  const target = normalizeIban(iban);
  const matched = rows.find(
    (row) => row.ACC && normalizeIban(String(row.ACC)) === target,
  );
  return matched ?? rows[0];
}

function parsePrivatDate(value?: string): Date | null {
  if (!value) return null;
  const parts = value.includes(".")
    ? value.split(".")
    : value.includes("-")
      ? value.split("-")
      : [];
  if (parts.length !== 3) return null;
  const [dd, mm, yyyy] = parts;
  const parsed = dayjs(`${yyyy}-${mm}-${dd}`);
  return parsed.isValid() ? parsed.toDate() : null;
}
