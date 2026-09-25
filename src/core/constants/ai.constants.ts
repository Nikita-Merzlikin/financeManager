/** Defaults and tool name constants for the finance AI agent. */
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
  GET_FINANCIAL_PLAN: "get_financial_plan",
  GET_PLAN_FORECAST: "get_plan_forecast",
  ANALYZE_FINANCIAL_PLAN: "analyze_financial_plan",
} as const;

export type AiToolName = (typeof AI_TOOL_NAMES)[keyof typeof AI_TOOL_NAMES];

export const LLM_PROVIDER = Symbol("LLM_PROVIDER");
