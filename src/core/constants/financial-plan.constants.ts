import { FinancialPlanFrequency } from "src/core/enums/financial-plan.enums";

/** Business constants for Financial Plan calculations. */

export const FINANCIAL_PLAN_DAYS_IN_WEEK = 7;

/** Used only when a calendar month length cannot be derived (fallback). */
export const FINANCIAL_PLAN_FALLBACK_DAYS_IN_MONTH = 30;

/** Minimum historical days required before baseline/forecast claims sufficiency. */
export const FINANCIAL_PLAN_MIN_HISTORY_DAYS = 14;

/** Lookback window (days) before plan start for baseline average expenses. */
export const FINANCIAL_PLAN_BASELINE_LOOKBACK_DAYS = 90;

/** Soft cap on category limit rows per plan. */
export const FINANCIAL_PLAN_MAX_CATEGORIES = 50;

/** Equality tolerance in minor units when classifying on-budget / on-limit. */
export const FINANCIAL_PLAN_BUDGET_EQUALITY_TOLERANCE_MINOR = 0n;

export const FINANCIAL_PLAN_FREQUENCIES_PER_MONTH: Record<
  FinancialPlanFrequency,
  number
> = {
  [FinancialPlanFrequency.DAILY]: FINANCIAL_PLAN_FALLBACK_DAYS_IN_MONTH,
  [FinancialPlanFrequency.TWICE_A_WEEK]: 8,
  [FinancialPlanFrequency.WEEKLY]: 4,
  [FinancialPlanFrequency.TWICE_A_MONTH]: 2,
  [FinancialPlanFrequency.MONTHLY]: 1,
};
