import { Injectable } from "@nestjs/common";
import {
  AccountSource,
  AccountType,
  MONOBANK_DEFAULT_LABEL,
  TransactionType,
} from "src/core/enums/finance.enums";
import { parseCredentials } from "../finance.utils";
import type {
  Bank,
  BankAccountData,
  BankTransactionData,
  SyncResult,
} from "./bank.interface";
import { buildMonobankExternalId } from "./bank-external-id";
import type { MonoCredentials } from "./bank-credentials.types";
import { MonobankClient } from "./monobank.client";
import type { MonoClientInfo } from "./monobank.types";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Injectable()
export class MonobankBank implements Bank {
  constructor(private readonly client: MonobankClient) {}

  async connect(
    credentialsJson: string,
    label?: string,
  ): Promise<{ accounts: BankAccountData[]; label: string }> {
    const credentials = parseCredentials<MonoCredentials>(credentialsJson);
    const info = await this.client.getClientInfo(credentials.token);
    return {
      accounts: this.mapAccounts(info),
      label: label ?? info.name ?? MONOBANK_DEFAULT_LABEL,
    };
  }

  async sync(credentialsJson: string, days: number): Promise<SyncResult> {
    const credentials = parseCredentials<MonoCredentials>(credentialsJson);
    const info = await this.client.getClientInfo(credentials.token);
    const accounts = this.mapAccounts(info);

    const syncDays = Math.min(days, 31);
    const to = Math.floor(Date.now() / 1000);
    const from = to - syncDays * 24 * 60 * 60;
    const monoAccounts = info.accounts ?? [];

    const transactions = new Map<string, BankTransactionData[]>();

    for (let i = 0; i < monoAccounts.length; i++) {
      await delay(61_000);
      const monoAccount = monoAccounts[i];

      const items = await this.client.getStatement(
        credentials.token,
        monoAccount.id,
        from,
        to,
      );

      const txs: BankTransactionData[] = items.map((item) => ({
        source: AccountSource.MONOBANK,
        externalId: buildMonobankExternalId(item.id),
        amountMinor: this.client.toMinorAmount(item.amount),
        type:
          item.amount >= 0 ? TransactionType.INCOME : TransactionType.EXPENSE,
        currency: this.client.mapCurrency(item.currencyCode),
        description: item.comment || item.description,
        occurredAt: new Date(item.time * 1000),
        mcc: item.mcc,
      }));

      transactions.set(monoAccount.id, txs);
    }

    return { accounts, transactions };
  }

  private mapAccounts(info: MonoClientInfo): BankAccountData[] {
    const accounts: BankAccountData[] = [];

    for (const mono of info.accounts ?? []) {
      accounts.push({
        source: AccountSource.MONOBANK,
        externalId: mono.id,
        name: `${mono.type} ${mono.maskedPan?.[0] ?? ""}`.trim(),
        type: mono.type === "fop" ? AccountType.FOP : AccountType.CARD,
        currency: this.client.mapCurrency(mono.currencyCode),
        balanceMinor: this.client.toMinorAmount(mono.balance),
        iban: mono.iban ?? null,
      });
    }

    for (const jar of info.jars ?? []) {
      accounts.push({
        source: AccountSource.MONOBANK,
        externalId: jar.id,
        name: jar.title,
        type: AccountType.JAR,
        currency: this.client.mapCurrency(jar.currencyCode),
        balanceMinor: this.client.toMinorAmount(jar.balance),
        iban: null,
      });
    }

    return accounts;
  }
}
