export const PRIVAT_API_URL =
  process.env.PRIVAT_AUTOCLIENT_BASE_URL || "https://acp.privatbank.ua/api";

export const PRIVAT_PATHS = {
  BALANCE: "/statements/balance",
  TRANSACTIONS: "/statements/transactions",
} as const;

export const PRIVAT_ENDPOINTS = {
  BALANCE: `${PRIVAT_API_URL}${PRIVAT_PATHS.BALANCE}`,
  TRANSACTIONS: `${PRIVAT_API_URL}${PRIVAT_PATHS.TRANSACTIONS}`,
} as const;
