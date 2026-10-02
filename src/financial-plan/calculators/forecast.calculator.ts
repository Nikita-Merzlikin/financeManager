import {
  FINANCIAL_PLAN_AHEAD_SPEND_RATIO,
  FINANCIAL_PLAN_ON_TRACK_SPEND_RATIO,
} from "src/core/constants/financial-plan.constants";
import {
  FinancialPlanDataStatus,
  FinancialPlanTrackStatus,
} from "src/core/enums/financial-plan.enums";
import type {
  ForecastInput,
  ForecastResult,
} from "src/core/types/financial-plan.types";
import { toDateKey } from "./financial-plan.calculator";

/**
 * Deterministic forecast from observed burn rate.
 * Returns INSUFFICIENT_DATA when history is too short — never invents numbers.
 */
export function calculateForecast(input: ForecastInput): ForecastResult {
  if (!input.hasEnoughHistory || input.daysElapsed <= 0) {
    return {
      dataStatus: FinancialPlanDataStatus.INSUFFICIENT_DATA,
      trackStatus: FinancialPlanTrackStatus.INSUFFICIENT_DATA,
      expectedSpendingMinor: null,
      expectedSavingsMinor: null,
      expectedAccumulatedMinor: null,
      expectedCompletionDate: null,
      onTrack: null,
    };
  }

  const remainingDays = Math.max(0, input.daysTotal - input.daysElapsed);
  const dailySpendRate =
    input.actualSpendToDateMinor / BigInt(input.daysElapsed);
  const expectedSpendingMinor =
    input.actualSpendToDateMinor + dailySpendRate * BigInt(remainingDays);

  const dailySavingsRate =
    input.actualSavingsToDateMinor / BigInt(input.daysElapsed);
  const expectedSavingsMinor =
    input.actualSavingsToDateMinor + dailySavingsRate * BigInt(remainingDays);

  const expectedAccumulatedMinor =
    input.accumulatedMinor +
    dailySavingsRate * BigInt(Math.max(0, remainingDays));

  let expectedCompletionDate: string | null = null;
  const stillNeeded =
    input.targetAmountMinor > expectedAccumulatedMinor
      ? input.targetAmountMinor - input.accumulatedMinor
      : 0n;

  if (stillNeeded === 0n) {
    expectedCompletionDate = toDateKey(input.asOf);
  } else if (dailySavingsRate > 0n) {
    const daysNeeded = Number(
      (stillNeeded + dailySavingsRate - 1n) / dailySavingsRate,
    );
    const projected = new Date(input.asOf);
    projected.setUTCDate(projected.getUTCDate() + daysNeeded);
    expectedCompletionDate = toDateKey(projected);
  }

  const spendRatio =
    input.plannedSpendToDateMinor === 0n
      ? input.actualSpendToDateMinor > 0n
        ? 2
        : 1
      : Number(
          (input.actualSpendToDateMinor * 100n) / input.plannedSpendToDateMinor,
        ) / 100;

  let trackStatus: FinancialPlanTrackStatus;
  let onTrack: boolean;
  if (spendRatio < FINANCIAL_PLAN_AHEAD_SPEND_RATIO) {
    trackStatus = FinancialPlanTrackStatus.AHEAD;
    onTrack = true;
  } else if (spendRatio <= FINANCIAL_PLAN_ON_TRACK_SPEND_RATIO) {
    trackStatus = FinancialPlanTrackStatus.ON_TRACK;
    onTrack = true;
  } else {
    trackStatus = FinancialPlanTrackStatus.BEHIND;
    onTrack = false;
  }

  // Goal date pressure: only demote on-track (not spend-ahead) when completion slips past target.
  if (
    trackStatus === FinancialPlanTrackStatus.ON_TRACK &&
    expectedCompletionDate &&
    expectedCompletionDate > toDateKey(input.targetDate)
  ) {
    trackStatus = FinancialPlanTrackStatus.BEHIND;
    onTrack = false;
  }

  return {
    dataStatus: FinancialPlanDataStatus.OK,
    trackStatus,
    expectedSpendingMinor,
    expectedSavingsMinor,
    expectedAccumulatedMinor,
    expectedCompletionDate,
    onTrack,
  };
}
