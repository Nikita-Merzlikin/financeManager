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

/** Spend ratio below this → ahead of plan. */
export const FINANCIAL_PLAN_AHEAD_SPEND_RATIO = 0.95;

/** Spend ratio up to this (inclusive) → on track. */
export const FINANCIAL_PLAN_ON_TRACK_SPEND_RATIO = 1.05;

export const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Fixed-point scale for percentage with 2 decimal places (xx.yy%). */
export const FINANCIAL_PLAN_PERCENT_SCALE = 10000n;
