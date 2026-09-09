import type {
  AccountSource,
  AccountType,
  TransactionType,
} from "src/core/enums/finance.enums";
import type {
  ConnectMonobankDto,
  ConnectPrivatDto,
} from "src/core/dto/finance.dto";

export type ConnectBankDto = ConnectMonobankDto | ConnectPrivatDto;

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

export interface ConnectResult extends SyncResult {
  credentialsJson: string;
  label: string;
  message: string;
}

export interface WebhookResult {
  accountExternalId: string;
  accountSource: AccountSource;
  transaction: BankTransactionData;
  balanceMinor?: bigint;
}

export interface Bank {
  connect(dto: ConnectBankDto): Promise<ConnectResult>;

  sync(
    credentialsJson: string,
    days: number,
    connectionLabel?: string | null,
  ): Promise<SyncResult>;

  handleWebhook?(payload: unknown): Promise<WebhookResult | null>;
}
