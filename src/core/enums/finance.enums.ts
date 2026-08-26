export enum AccountSource {
  MANUAL = "manual",
  MONOBANK = "monobank",
  PRIVAT = "privat",
}

export enum AccountType {
  CASH = "cash",
  CARD = "card",
  BANK = "bank",
  JAR = "jar",
  FOP = "fop",
  OTHER = "other",
}

export enum TransactionType {
  INCOME = "income",
  EXPENSE = "expense",
}

export enum BankProvider {
  MONOBANK = "monobank",
  PRIVAT = "privat",
}

/** Privat AutoClient TRANTYPE credit markers */
export enum PrivatTransactionType {
  CREDIT = "C",
  CREDIT_SHORT = "CR",
  CREDIT_FULL = "CREDIT",
}

export const PRIVAT_CREDIT_TYPES = new Set<string>([
  PrivatTransactionType.CREDIT,
  PrivatTransactionType.CREDIT_SHORT,
  PrivatTransactionType.CREDIT_FULL,
]);

export const PRIVAT_DEFAULT_ACCOUNT_LABEL = "Privat FOP";
export const PRIVAT_DEFAULT_TX_DESCRIPTION = "Privat transaction";
export const MONOBANK_DEFAULT_LABEL = "Monobank";
