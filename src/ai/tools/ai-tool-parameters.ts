import type { LlmToolParameterSchema } from "src/core/types/ai.types";
import { TransactionType } from "src/core/enums/finance.enums";

/** JSON-schema declarations for Gemini tools (kept in sync with AI tool DTOs). */
export const AI_PERIOD_PARAMETERS: LlmToolParameterSchema = {
  type: "object",
  properties: {
    from: {
      type: "string",
      description: "Period start ISO-8601 (e.g. 2026-09-01T00:00:00.000Z)",
      format: "date-time",
    },
    to: {
      type: "string",
      description: "Period end ISO-8601 (e.g. 2026-09-16T23:59:59.000Z)",
      format: "date-time",
    },
  },
  required: [],
};

export const AI_GET_TRANSACTIONS_PARAMETERS: LlmToolParameterSchema = {
  type: "object",
  properties: {
    ...AI_PERIOD_PARAMETERS.properties,
    categoryId: {
      type: "string",
      description: "Category UUID to filter by",
    },
    type: {
      type: "string",
      enum: [TransactionType.INCOME, TransactionType.EXPENSE],
      description: "Transaction type filter",
    },
  },
  required: [],
};

export const AI_CREATE_TRANSACTION_PARAMETERS: LlmToolParameterSchema = {
  type: "object",
  properties: {
    accountId: {
      type: "string",
      description: "UUID of the user's account",
    },
    type: {
      type: "string",
      enum: [TransactionType.INCOME, TransactionType.EXPENSE],
    },
    amount: {
      type: "number",
      description: "Amount in major currency units (> 0)",
    },
    categoryId: {
      type: "string",
      description: "Optional category UUID matching the transaction type",
    },
    currency: {
      type: "string",
      description: "Optional 3-letter currency code",
    },
    description: {
      type: "string",
      description: "Optional description",
    },
    occurredAt: {
      type: "string",
      description: "Optional ISO-8601 timestamp",
      format: "date-time",
    },
  },
  required: ["accountId", "type", "amount"],
};

export const AI_EMPTY_PARAMETERS: LlmToolParameterSchema = {
  type: "object",
  properties: {},
  required: [],
};
