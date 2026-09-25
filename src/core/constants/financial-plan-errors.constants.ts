export const FINANCIAL_PLAN_ERROR_MESSAGES = {
  PLAN_NOT_FOUND: "Active financial plan not found",
  PLAN_ALREADY_ACTIVE: "User already has an active financial plan",
  INVALID_TARGET_DATE: "Target date must be in the future",
  INVALID_BUDGET:
    "Income must cover savings, goal contribution, and category limits",
  INVALID_CATEGORY: "Invalid or inaccessible category for financial plan",
  TOO_MANY_CATEGORIES: "Too many category limits on the financial plan",
  INVALID_AI_RESPONSE: "AI recommendation response was malformed",
  AI_UNAVAILABLE: "AI recommendation is temporarily unavailable",
  PLAN_CREATED: "Financial plan created",
  PLAN_UPDATED: "Financial plan updated",
  PLAN_ARCHIVED: "Financial plan archived",
} as const;
