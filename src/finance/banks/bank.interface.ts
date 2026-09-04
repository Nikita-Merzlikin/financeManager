import type {
  AccountSource,
  AccountType,
  TransactionType,
} from "src/core/enums/finance.enums";

export interface BankAccountData {
  source: AccountSource;
  externalId: string;
  name: string;
  type: AccountType;
  currency: string;
  balanceMinor: bigint;
  iban: string | null;
}

export interface BankTransactionData {
  source: AccountSource;
  externalId: string;
  amountMinor: bigint;
  type: TransactionType;
  currency: string;
  description: string;
  occurredAt: Date;
  mcc: number | null;
}

export interface SyncResult {
  accounts: BankAccountData[];
  /** externalId of the account → transactions for that account */
  transactions: Map<string, BankTransactionData[]>;
}

export interface Bank {
  connect(
    credentialsJson: string,
    label?: string,
  ): Promise<{
    accounts: BankAccountData[];
    label: string;
  }>;

  sync(
    credentialsJson: string,
    days: number,
    connectionLabel?: string | null,
  ): Promise<SyncResult>;
}
