/** Financial Plan domain enums — no magic strings in services/calculators. */

export enum FinancialPlanStatusEnum {
  ACTIVE = "active",
  ARCHIVED = "archived",
}
export { FinancialPlanStatusEnum as FinancialPlanStatus };

export enum FinancialPlanFrequencyEnum {
  DAILY = "daily",
  TWICE_A_WEEK = "twice_a_week",
  WEEKLY = "weekly",
  TWICE_A_MONTH = "twice_a_month",
  MONTHLY = "monthly",
}
export { FinancialPlanFrequencyEnum as FinancialPlanFrequency };

export enum FinancialPlanPeriodStatusEnum {
  UNDER_BUDGET = "under_budget",
  ON_BUDGET = "on_budget",
  OVER_BUDGET = "over_budget",
  NO_BUDGET = "no_budget",
}
export { FinancialPlanPeriodStatusEnum as FinancialPlanPeriodStatus };

export enum FinancialPlanCategoryStatusEnum {
  UNDER_LIMIT = "under_limit",
  ON_LIMIT = "on_limit",
  OVER_LIMIT = "over_limit",
  UNLIMITED = "unlimited",
}
export { FinancialPlanCategoryStatusEnum as FinancialPlanCategoryStatus };

export enum FinancialPlanTrackStatusEnum {
  AHEAD = "ahead",
  ON_TRACK = "on_track",
  BEHIND = "behind",
  INSUFFICIENT_DATA = "insufficient_data",
}
export { FinancialPlanTrackStatusEnum as FinancialPlanTrackStatus };

export enum FinancialPlanDataStatusEnum {
  OK = "ok",
  INSUFFICIENT_DATA = "insufficient_data",
}
export { FinancialPlanDataStatusEnum as FinancialPlanDataStatus };

export enum FinancialPlanRecommendationTypeEnum {
  REDUCE_CATEGORY_LIMIT = "reduce_category_limit",
  INCREASE_CATEGORY_LIMIT = "increase_category_limit",
  INCREASE_SAVINGS = "increase_savings",
  DECREASE_SAVINGS = "decrease_savings",
  EXTEND_GOAL_DATE = "extend_goal_date",
  REDUCE_GOAL_TARGET = "reduce_goal_target",
  REVIEW_CATEGORY = "review_category",
  REVIEW_EXPENSE = "review_expense",
  PLAN_ON_TRACK = "plan_on_track",
  PLAN_AT_RISK = "plan_at_risk",
}
export { FinancialPlanRecommendationTypeEnum as FinancialPlanRecommendationType };
