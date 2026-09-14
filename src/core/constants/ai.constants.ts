export const AI_DEFAULT_MODEL = "gemini-3.8-flash";
export const AI_DEFAULT_MAX_TOOL_ITERATIONS = 5;
export const AI_DEFAULT_TIMEOUT_MS = 30_000;
export const AI_DEFAULT_MAX_INPUT_LENGTH = 4_000;

export const AI_TOOL_NAMES = {
  GET_BALANCE: "get_balance",
  GET_TRANSACTIONS: "get_transactions",
  GET_CATEGORIES: "get_categories",
  GET_DASHBOARD: "get_dashboard",
  CREATE_TRANSACTION: "create_transaction",
} as const;

export type AiToolName = (typeof AI_TOOL_NAMES)[keyof typeof AI_TOOL_NAMES];

export const LLM_PROVIDER = Symbol("LLM_PROVIDER");
