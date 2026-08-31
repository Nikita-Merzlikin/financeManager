export enum AccountSourceEnum {
  MANUAL = "manual",
  MONOBANK = "monobank",
  PRIVAT = "privat",
}
export { AccountSourceEnum as AccountSource };

export enum AccountTypeEnum {
  CASH = "cash",
  CARD = "card",
  BANK = "bank",
  JAR = "jar",
  FOP = "fop",
  OTHER = "other",
}
export { AccountTypeEnum as AccountType };

export enum TransactionTypeEnum {
  INCOME = "income",
  EXPENSE = "expense",
}
export { TransactionTypeEnum as TransactionType };

export enum BankProviderEnum {
  MONOBANK = "monobank",
  PRIVAT = "privat",
}
export { BankProviderEnum as BankProvider };

export enum CurrencyEnum {
  UAH = "UAH",
  USD = "USD",
  EUR = "EUR",
}
export { CurrencyEnum as Currency };

export enum IsoCurrencyCodeEnum {
  UAH = 980,
  USD = 840,
  EUR = 978,
}
export { IsoCurrencyCodeEnum as IsoCurrencyCode };

/** Privat AutoClient TRANTYPE credit markers */
export enum PrivatTransactionTypeEnum {
  CREDIT = "C",
  CREDIT_SHORT = "CR",
  CREDIT_FULL = "CREDIT",
}
export { PrivatTransactionTypeEnum as PrivatTransactionType };

export const PRIVAT_CREDIT_TYPES = new Set<string>([
  PrivatTransactionTypeEnum.CREDIT,
  PrivatTransactionTypeEnum.CREDIT_SHORT,
  PrivatTransactionTypeEnum.CREDIT_FULL,
]);

export const DEFAULT_CURRENCY = CurrencyEnum.UAH;
export const DEFAULT_ACCOUNT_TYPE = AccountTypeEnum.CARD;
export const PRIVAT_DEFAULT_ACCOUNT_LABEL = "Privat FOP";
export const PRIVAT_DEFAULT_TX_DESCRIPTION = "Privat transaction";
export const MONOBANK_DEFAULT_LABEL = "Monobank";
