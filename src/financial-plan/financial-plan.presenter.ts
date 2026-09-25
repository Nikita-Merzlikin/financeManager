import {
  FinancialPlanCategoryResponseDto,
  FinancialPlanDayResponseDto,
  FinancialPlanPeriodResponseDto,
} from "src/core/dto/financial-plan.dto";
import { FinancialPlanFrequency } from "src/core/enums/financial-plan.enums";
import type {
  CategoryVarianceResult,
  RedistributedDay,
} from "src/core/types/financial-plan.types";
import { fromMinorUnits } from "src/finance/finance.utils";
import { aggregatePeriod } from "./calculators/budget-redistribution.calculator";
import {
  daysInMonth,
  parseDateKey,
} from "./calculators/financial-plan.calculator";

/** Maps a calculated day to the calendar API shape. */
export function toFinancialPlanDayResponse(
  day: RedistributedDay,
): FinancialPlanDayResponseDto {
  return {
    date: day.date,
    planned: fromMinorUnits(day.plannedMinor),
    actual: fromMinorUnits(day.actualMinor),
    remaining: fromMinorUnits(day.remainingMinor),
    variance: fromMinorUnits(day.varianceMinor),
    status: day.status,
    locked: day.locked,
  };
}

/** Maps category variance (minor units) to the categories API shape. */
export function toFinancialPlanCategoryResponse(
  variance: CategoryVarianceResult,
): FinancialPlanCategoryResponseDto {
  return {
    categoryId: variance.categoryId,
    name: variance.name,
    limit:
      variance.limitMinor === null ? null : fromMinorUnits(variance.limitMinor),
    actual: fromMinorUnits(variance.actualMinor),
    remaining:
      variance.remainingMinor === null
        ? null
        : fromMinorUnits(variance.remainingMinor),
    percentageUsed: variance.percentageUsed,
    variance:
      variance.varianceMinor === null
        ? null
        : fromMinorUnits(variance.varianceMinor),
    status: variance.status,
    isMandatory: variance.isMandatory,
  };
}

/**
 * Groups already-calculated days into presentation periods.
 * Frequency only changes bucket size; daily amounts stay the source of truth.
 */
export function groupDaysByFrequency(
  days: RedistributedDay[],
  frequency: FinancialPlanFrequency,
  startDate: string,
): FinancialPlanPeriodResponseDto[] {
  if (days.length === 0) return [];

  const periods: FinancialPlanPeriodResponseDto[] = [];
  let bucket: RedistributedDay[] = [];
  const size = periodDaySize(frequency, startDate);

  const flush = () => {
    if (bucket.length === 0) return;
    const agg = aggregatePeriod(bucket);
    periods.push({
      from: bucket[0].date,
      to: bucket[bucket.length - 1].date,
      planned: fromMinorUnits(agg.plannedMinor),
      actual: fromMinorUnits(agg.actualMinor),
      remaining: fromMinorUnits(agg.remainingMinor),
      saved: fromMinorUnits(agg.savedMinor),
      variance: fromMinorUnits(agg.varianceMinor),
      status: agg.status,
    });
    bucket = [];
  };

  for (const day of days) {
    bucket.push(day);
    if (bucket.length >= size) flush();
  }
  flush();
  return periods;
}

function periodDaySize(
  frequency: FinancialPlanFrequency,
  startDate: string,
): number {
  switch (frequency) {
    case FinancialPlanFrequency.DAILY:
      return 1;
    case FinancialPlanFrequency.TWICE_A_WEEK:
      return 3;
    case FinancialPlanFrequency.WEEKLY:
      return 7;
    case FinancialPlanFrequency.TWICE_A_MONTH:
      return 15;
    case FinancialPlanFrequency.MONTHLY:
      return daysInMonth(parseDateKey(startDate));
    default:
      return 1;
  }
}
