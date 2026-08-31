export const MONO_API_URL =
  process.env.MONOBANK_API_BASE_URL || "https://api.monobank.ua";

export const MONO_PATHS = {
  CLIENT_INFO: "/personal/client-info",
  STATEMENT: "/personal/statement",
  WEBHOOK: "/personal/webhook",
} as const;

export const MONO_ENDPOINTS = {
  CLIENT_INFO: `${MONO_API_URL}${MONO_PATHS.CLIENT_INFO}`,
  STATEMENT: `${MONO_API_URL}${MONO_PATHS.STATEMENT}`,
  WEBHOOK: `${MONO_API_URL}${MONO_PATHS.WEBHOOK}`,
} as const;
