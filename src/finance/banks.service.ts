import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import {
  ConnectMonobankDto,
  ConnectPrivatDto,
  SyncBankDto,
} from "src/core/dto/finance.dto";
import { Account } from "src/db/dbModels/Account";
import { BankConnection } from "src/db/dbModels/BankConnection";
import { Transaction } from "src/db/dbModels/Transaction";
import { MonobankClient } from "./banks/monobank.client";
import { PrivatClient } from "./banks/privat.client";
import {
  decryptCredentials,
  encryptCredentials,
  formatMoney,
  toMoney,
} from "./finance.utils";

type MonoCredentials = { token: string };
type PrivatCredentials = { clientId: string; token: string; iban: string };

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

  async connectMonobank(userId: string, dto: ConnectMonobankDto) {
    const info = await this.monobankClient.getClientInfo(dto.token);
    const [connection] = await this.bankConnectionModel.findOrCreate({
      where: { userId, provider: "monobank", isActive: true },
      defaults: {
        userId,
        provider: "monobank",
        credentialsEncrypted: encryptCredentials({ token: dto.token }),
        label: dto.label ?? info.name ?? "Monobank",
        isActive: true,
      },
    });

    await connection.update({
      credentialsEncrypted: encryptCredentials({ token: dto.token }),
      label: dto.label ?? connection.label ?? info.name ?? "Monobank",
      isActive: true,
    });

    await this.importMonobankAccounts(userId, connection, info);
    await connection.update({ lastSyncedAt: new Date() });

    return {
      id: connection.id,
      provider: connection.provider,
      label: connection.label,
      lastSyncedAt: connection.lastSyncedAt,
      message:
        "Connected. Call POST /banks/connections/:id/sync to import statements (rate limit ~60s).",
    };
  }

  async connectPrivat(userId: string, dto: ConnectPrivatDto) {
    await this.privatClient.getBalance(dto.clientId, dto.token, dto.iban);

    const [connection] = await this.bankConnectionModel.findOrCreate({
      where: { userId, provider: "privat", isActive: true },
      defaults: {
        userId,
        provider: "privat",
        credentialsEncrypted: encryptCredentials({
          clientId: dto.clientId,
          token: dto.token,
          iban: dto.iban,
        }),
        label: dto.label ?? "Privat FOP",
        isActive: true,
      },
    });

    await connection.update({
      credentialsEncrypted: encryptCredentials({
        clientId: dto.clientId,
        token: dto.token,
        iban: dto.iban,
      }),
      label: dto.label ?? connection.label ?? "Privat FOP",
      isActive: true,
    });

    await this.syncPrivat(userId, connection, 30);
    return {
      id: connection.id,
      provider: connection.provider,
      label: connection.label,
      lastSyncedAt: connection.lastSyncedAt,
      message: "Connected and synced Privat FOP account",
    };
  }

  async listConnections(userId: string) {
    const items = await this.bankConnectionModel.findAll({
      where: { userId, isActive: true },
      order: [["createdAt", "DESC"]],
    });
    return items.map((item) => ({
      id: item.id,
      provider: item.provider,
      label: item.label,
      lastSyncedAt: item.lastSyncedAt,
    }));
  }

  async sync(userId: string, connectionId: string, dto: SyncBankDto) {
    const connection = await this.findOwned(userId, connectionId);
    const days = Math.min(Math.max(dto.days ?? 30, 1), 90);

    if (connection.provider === "monobank") {
      await this.syncMonobank(userId, connection, days);
    } else {
      await this.syncPrivat(userId, connection, days);
    }

    return {
      id: connection.id,
      provider: connection.provider,
      lastSyncedAt: connection.lastSyncedAt,
      message: "Synced successfully",
    };
  }

  async disconnect(userId: string, connectionId: string) {
    const connection = await this.findOwned(userId, connectionId);
    await connection.update({ isActive: false });
    await this.accountModel.update(
      { isActive: false },
      { where: { userId, bankConnectionId: connection.id } },
    );
    return { message: "Bank connection disconnected" };
  }

  async handleMonobankWebhook(payload: {
    type?: string;
    data?: {
      account?: string;
      statementItem?: {
        id: string;
        time: number;
        description: string;
        mcc: number;
        amount: number;
        currencyCode: number;
        comment?: string;
      };
    };
  }) {
    if (payload.type !== "StatementItem" || !payload.data?.statementItem) {
      return { message: "ignored" };
    }

    const externalAccountId = payload.data.account;
    const item = payload.data.statementItem;
    if (!externalAccountId) return { message: "ignored" };

    const account = await this.accountModel.findOne({
      where: {
        source: "monobank",
        externalId: externalAccountId,
        isActive: true,
      },
    });
    if (!account) return { message: "account not found" };

    await this.upsertBankTransaction({
      userId: account.userId,
      accountId: account.id,
      source: "monobank",
      externalId: `monobank:${item.id}`,
      amount: this.monobankClient.toMajorAmount(item.amount),
      type: item.amount >= 0 ? "income" : "expense",
      currency: this.monobankClient.mapCurrency(item.currencyCode),
      description: item.comment || item.description,
      occurredAt: new Date(item.time * 1000),
      mcc: item.mcc,
    });

    const balanceMinor = (
      payload.data.statementItem as { balance?: number }
    ).balance;
    if (typeof balanceMinor === "number") {
      await account.update({
        balance: formatMoney(fromAbsBalance(balanceMinor)),
      });
    }

    return { message: "ok" };
  }

  private async importMonobankAccounts(
    userId: string,
    connection: BankConnection,
    info: {
      accounts?: Array<{
        id: string;
        balance: number;
        type: string;
        currencyCode: number;
        maskedPan?: string[];
        iban?: string;
      }>;
      jars?: Array<{
        id: string;
        title: string;
        balance: number;
        currencyCode: number;
      }>;
    },
  ) {
    for (const monoAccount of info.accounts ?? []) {
      await this.upsertAccount({
        userId,
        bankConnectionId: connection.id,
        source: "monobank",
        externalId: monoAccount.id,
        name: `${monoAccount.type} ${monoAccount.maskedPan?.[0] ?? ""}`.trim(),
        type: monoAccount.type === "fop" ? "fop" : "card",
        currency: this.monobankClient.mapCurrency(monoAccount.currencyCode),
        balance: this.monobankClient.toMajorAmount(monoAccount.balance),
        iban: monoAccount.iban ?? null,
      });
    }

    for (const jar of info.jars ?? []) {
      await this.upsertAccount({
        userId,
        bankConnectionId: connection.id,
        source: "monobank",
        externalId: jar.id,
        name: jar.title,
        type: "jar",
        currency: this.monobankClient.mapCurrency(jar.currencyCode),
        balance: this.monobankClient.toMajorAmount(jar.balance),
        iban: null,
      });
    }
  }

  private async syncMonobank(
    userId: string,
    connection: BankConnection,
    days: number,
  ) {
    const credentials = decryptCredentials<MonoCredentials>(
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
          source: "monobank",
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
          source: "monobank",
          externalId: `monobank:${item.id}`,
          amount: this.monobankClient.toMajorAmount(item.amount),
          type: item.amount >= 0 ? "income" : "expense",
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
    const credentials = decryptCredentials<PrivatCredentials>(
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
    const balanceRow = balances[0];
    const balanceValue = Number(
      balanceRow?.BALANCEOUT ?? balanceRow?.balance ?? 0,
    );
    const currency =
      balanceRow?.CCY || balanceRow?.currency || "UAH";

    const account = await this.upsertAccount({
      userId,
      bankConnectionId: connection.id,
      source: "privat",
      externalId: credentials.iban,
      name: connection.label || "Privat FOP",
      type: "fop",
      currency,
      balance: toMoney(balanceValue),
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
      const amount = Math.abs(Number(row.SUM ?? row.AMOUNT ?? 0));
      if (!amount) continue;
      const tranType = (row.TRANTYPE || "").toUpperCase();
      const type: "income" | "expense" =
        tranType === "C" || tranType === "CR" || tranType === "CREDIT"
          ? "income"
          : "expense";
      const externalId =
        row.ID != null
          ? `privat:${row.ID}`
          : `privat:${credentials.iban}:${row.DAT_OD}:${amount}:${row.OSND || row.PURPOSE || ""}`;

      await this.upsertBankTransaction({
        userId,
        accountId: account.id,
        source: "privat",
        externalId,
        amount: toMoney(amount),
        type,
        currency: row.CCY || row.currency || currency,
        description: row.OSND || row.PURPOSE || "Privat transaction",
        occurredAt: parsePrivatDate(row.DAT_OD) ?? new Date(),
        mcc: null,
      });
    }

    await connection.update({ lastSyncedAt: new Date() });
  }

  private async upsertAccount(input: {
    userId: string;
    bankConnectionId: string;
    source: "monobank" | "privat";
    externalId: string;
    name: string;
    type: Account["type"];
    currency: string;
    balance: number;
    iban: string | null;
  }) {
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
        balance: formatMoney(input.balance),
        iban: input.iban,
        isActive: true,
      },
    });

    await account.update({
      bankConnectionId: input.bankConnectionId,
      name: input.name,
      type: input.type,
      currency: input.currency,
      balance: formatMoney(input.balance),
      iban: input.iban,
      isActive: true,
    });

    return account;
  }

  private async upsertBankTransaction(input: {
    userId: string;
    accountId: string;
    source: "monobank" | "privat";
    externalId: string;
    amount: number;
    type: "income" | "expense";
    currency: string;
    description: string;
    occurredAt: Date;
    mcc: number | null;
    accountBalance?: number;
  }) {
    const existing = await this.transactionModel.findOne({
      where: { externalId: input.externalId },
    });
    if (existing) {
      await existing.update({
        description: input.description,
        amount: formatMoney(input.amount),
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
      amount: formatMoney(input.amount),
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
      throw new NotFoundException("Bank connection not found");
    }
    return connection;
  }
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(date.getTime()) ? null : date;
}

function fromAbsBalance(minor: number): number {
  return Math.round(Math.abs(minor)) / 100;
}
