import { Injectable } from "@nestjs/common";
import dayjs from "dayjs";
import {
  AccountSource,
  AccountType,
  DEFAULT_CURRENCY,
  PRIVAT_CREDIT_TYPES,
  PRIVAT_DEFAULT_ACCOUNT_LABEL,
  PRIVAT_DEFAULT_TX_DESCRIPTION,
  TransactionType,
} from "src/core/enums/finance.enums";
import { parseCredentials, toMinorUnits } from "../finance.utils";
import type {
  Bank,
  BankAccountData,
  BankTransactionData,
  SyncResult,
} from "./bank.interface";
import type { PrivatCredentials } from "./bank-credentials.types";
import { buildPrivatExternalId, normalizeIban } from "./bank-external-id";
import { PrivatClient } from "./privat.client";
import type { PrivatBalanceRow } from "./privat.types";

@Injectable()
export class PrivatBank implements Bank {
  constructor(private readonly client: PrivatClient) {}

  async connect(
    credentialsJson: string,
    label?: string,
  ): Promise<{ accounts: BankAccountData[]; label: string }> {
    const credentials = parseCredentials<PrivatCredentials>(credentialsJson);
    await this.client.getBalance(
      credentials.clientId,
      credentials.token,
      credentials.iban,
    );

    return {
      accounts: [],
      label: label ?? PRIVAT_DEFAULT_ACCOUNT_LABEL,
    };
  }

  async sync(
    credentialsJson: string,
    days: number,
    connectionLabel?: string | null,
  ): Promise<SyncResult> {
    const credentials = parseCredentials<PrivatCredentials>(credentialsJson);
    const to = new Date();
    const from = new Date();
    from.setDate(to.getDate() - days);
    const startDate = this.client.formatDate(from);
    const endDate = this.client.formatDate(to);

    const balances = await this.client.getBalance(
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

    const account: BankAccountData = {
      source: AccountSource.PRIVAT,
      externalId: credentials.iban,
      name: connectionLabel || PRIVAT_DEFAULT_ACCOUNT_LABEL,
      type: AccountType.FOP,
      currency,
      balanceMinor: toMinorUnits(balanceMajor),
      iban: credentials.iban,
    };

    const rows = await this.client.getTransactions(
      credentials.clientId,
      credentials.token,
      credentials.iban,
      startDate,
      endDate,
    );

    const txs: BankTransactionData[] = [];
    for (const row of rows) {
      const amountMajor = Math.abs(Number(row.SUM ?? row.AMOUNT ?? 0));
      if (!amountMajor) continue;
      const amountMinor = toMinorUnits(amountMajor);
      const tranType = (row.TRANTYPE || "").toUpperCase();
      const type = PRIVAT_CREDIT_TYPES.has(tranType)
        ? TransactionType.INCOME
        : TransactionType.EXPENSE;

      txs.push({
        source: AccountSource.PRIVAT,
        externalId: buildPrivatExternalId(row, credentials.iban, amountMinor),
        amountMinor,
        type,
        currency: row.CCY || row.currency || currency,
        description: row.OSND || row.PURPOSE || PRIVAT_DEFAULT_TX_DESCRIPTION,
        occurredAt: parsePrivatDate(row.DAT_OD) ?? new Date(),
        mcc: null,
      });
    }

    const transactions = new Map<string, BankTransactionData[]>();
    transactions.set(credentials.iban, txs);

    return { accounts: [account], transactions };
  }
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
