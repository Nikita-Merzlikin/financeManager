import {
  FINANCIAL_PLAN_DAYS_IN_WEEK,
  FINANCIAL_PLAN_FALLBACK_DAYS_IN_MONTH,
} from "src/core/constants/financial-plan.constants";
import {
  FinancialPlanCategoryStatus,
  FinancialPlanFrequency,
  FinancialPlanPeriodStatus,
} from "src/core/enums/financial-plan.enums";
import type {
  CategorySpendInput,
  CategoryVarianceResult,
  FinancialPlanBudgetBreakdown,
  FinancialPlanBudgetInput,
  PlanProgressInput,
  PlanProgressResult,
} from "src/core/types/financial-plan.types";

/** Calendar days in the month of `date`. */
export function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Whole months remaining until target date (minimum 1 to avoid division by zero). */
export function monthsUntil(asOf: Date, targetDate: Date): number {
  let months =
    (targetDate.getUTCFullYear() - asOf.getUTCFullYear()) * 12 +
    (targetDate.getUTCMonth() - asOf.getUTCMonth());
  if (targetDate.getUTCDate() < asOf.getUTCDate()) {
    months -= 1;
  }
  return Math.max(1, months);
}

export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseDateKey(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function addDays(dateKey: string, days: number): string {
  const d = parseDateKey(dateKey);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateKey(d);
}

export function eachDateInclusive(fromKey: string, toKey: string): string[] {
  const result: string[] = [];
  let cursor = fromKey;
  while (cursor <= toKey) {
    result.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return result;
}

/**
 * Core monthly → daily budget breakdown.
 * Spending budget = income − desired savings − goal contribution − mandatory expenses.
 * Discretionary = spending budget − explicit category limits.
 */
export function calculateBudgetBreakdown(
  input: FinancialPlanBudgetInput,
): FinancialPlanBudgetBreakdown {
  const remainingGoal = max0(
    input.targetAmountMinor - input.accumulatedTowardGoalMinor,
  );
  const months = monthsUntil(input.asOf, input.targetDate);
  const goalContributionMonthlyMinor = remainingGoal / BigInt(months);

  const plannedSavingsMonthlyMinor = input.desiredSavingsMinor;

  const monthlySpendingBudgetMinor = max0(
    input.incomeMinor -
      plannedSavingsMonthlyMinor -
      goalContributionMonthlyMinor -
      input.mandatoryExpensesMinor,
  );

  const discretionaryMonthlyMinor = max0(
    monthlySpendingBudgetMinor - input.categoryLimitsMinor,
  );

  const days = daysInMonth(input.asOf) || FINANCIAL_PLAN_FALLBACK_DAYS_IN_MONTH;

  // Floor division keeps minor units integer; remainder is ignored (never create money).
  const dailySpendingBudgetMinor = monthlySpendingBudgetMinor / BigInt(days);
  const weeklySpendingBudgetMinor =
    dailySpendingBudgetMinor * BigInt(FINANCIAL_PLAN_DAYS_IN_WEEK);

  return {
    goalContributionMonthlyMinor,
    monthlySpendingBudgetMinor,
    discretionaryMonthlyMinor,
    plannedSavingsMonthlyMinor,
    daysInCurrentMonth: days,
    dailySpendingBudgetMinor,
    weeklySpendingBudgetMinor,
  };
}

export function classifyPeriodStatus(
  plannedMinor: bigint,
  actualMinor: bigint,
): FinancialPlanPeriodStatus {
  if (plannedMinor <= 0n) {
    return actualMinor > 0n
      ? FinancialPlanPeriodStatus.OVER_BUDGET
      : FinancialPlanPeriodStatus.NO_BUDGET;
  }
  if (actualMinor > plannedMinor) {
    return FinancialPlanPeriodStatus.OVER_BUDGET;
  }
  if (actualMinor < plannedMinor) {
    return FinancialPlanPeriodStatus.UNDER_BUDGET;
  }
  return FinancialPlanPeriodStatus.ON_BUDGET;
}

export function calculateCategoryVariance(
  input: CategorySpendInput,
): CategoryVarianceResult {
  if (input.limitMinor === null) {
    return {
      categoryId: input.categoryId,
      name: input.name,
      limitMinor: null,
      actualMinor: input.actualMinor,
      remainingMinor: null,
      percentageUsed: null,
      varianceMinor: null,
      status: FinancialPlanCategoryStatus.UNLIMITED,
      isMandatory: input.isMandatory,
    };
  }

  const remaining = input.limitMinor - input.actualMinor;
  const percentageUsed =
    input.limitMinor === 0n
      ? input.actualMinor > 0n
        ? 100
        : 0
      : Number((input.actualMinor * 10000n) / input.limitMinor) / 100;

  let status: FinancialPlanCategoryStatus;
  if (input.actualMinor > input.limitMinor) {
    status = FinancialPlanCategoryStatus.OVER_LIMIT;
  } else if (input.actualMinor < input.limitMinor) {
    status = FinancialPlanCategoryStatus.UNDER_LIMIT;
  } else {
    status = FinancialPlanCategoryStatus.ON_LIMIT;
  }

  return {
    categoryId: input.categoryId,
    name: input.name,
    limitMinor: input.limitMinor,
    actualMinor: input.actualMinor,
    remainingMinor: remaining,
    percentageUsed,
    varianceMinor: remaining,
    status,
    isMandatory: input.isMandatory,
  };
}

export function calculatePlanProgress(
  input: PlanProgressInput,
): PlanProgressResult {
  const remaining = max0(input.targetAmountMinor - input.accumulatedMinor);
  const percentageComplete =
    input.targetAmountMinor === 0n
      ? 100
      : Math.min(
          100,
          Number((input.accumulatedMinor * 10000n) / input.targetAmountMinor) /
            100,
        );

  let projectedCompletionDate: string | null = null;
  if (remaining === 0n) {
    projectedCompletionDate = toDateKey(input.asOf);
  } else if (input.monthlySavingsMinor > 0n) {
    const monthsNeeded = Number(
      (remaining + input.monthlySavingsMinor - 1n) / input.monthlySavingsMinor,
    );
    const projected = new Date(input.asOf);
    projected.setUTCMonth(projected.getUTCMonth() + monthsNeeded);
    projectedCompletionDate = toDateKey(projected);
  }

  return {
    accumulatedMinor: input.accumulatedMinor,
    targetAmountMinor: input.targetAmountMinor,
    remainingMinor: remaining,
    percentageComplete,
    projectedCompletionDate,
  };
}

/** Map a monthly amount into a presentation-period amount by frequency. */
export function monthlyToPeriodAmount(
  monthlyMinor: bigint,
  frequency: FinancialPlanFrequency,
  daysInPeriodMonth: number,
): bigint {
  switch (frequency) {
    case FinancialPlanFrequency.DAILY:
      return monthlyMinor / BigInt(Math.max(1, daysInPeriodMonth));
    case FinancialPlanFrequency.TWICE_A_WEEK:
      return (monthlyMinor * 7n) / (BigInt(daysInPeriodMonth) * 2n);
    case FinancialPlanFrequency.WEEKLY:
      return (monthlyMinor * 7n) / BigInt(Math.max(1, daysInPeriodMonth));
    case FinancialPlanFrequency.TWICE_A_MONTH:
      return monthlyMinor / 2n;
    case FinancialPlanFrequency.MONTHLY:
    default:
      return monthlyMinor;
  }
}

function max0(value: bigint): bigint {
  return value < 0n ? 0n : value;
}
