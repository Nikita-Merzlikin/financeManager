export const MONO_API_URL = "https://api.monobank.ua";

export const MONO_ENDPOINTS = {
  CLIENT_INFO: `${MONO_API_URL}/personal/client-info`,
  STATEMENT: `${MONO_API_URL}/personal/statement`,
  WEBHOOK: `${MONO_API_URL}/personal/webhook`,
} as const;
