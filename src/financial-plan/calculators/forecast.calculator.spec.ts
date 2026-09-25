import {
  FinancialPlanDataStatus,
  FinancialPlanTrackStatus,
} from "src/core/enums/financial-plan.enums";
import { toMinorUnits } from "src/finance/finance.utils";
import { calculateForecast } from "./forecast.calculator";

describe("forecast.calculator", () => {
  const base = {
    daysTotal: 30,
    plannedSpendToDateMinor: 3000n,
    actualSpendToDateMinor: 3000n,
    plannedSavingsMonthlyMinor: toMinorUnits(5_000),
    actualSavingsToDateMinor: toMinorUnits(2_000),
    targetAmountMinor: toMinorUnits(100_000),
    accumulatedMinor: toMinorUnits(10_000),
    asOf: new Date("2026-09-15T00:00:00.000Z"),
    targetDate: new Date("2027-03-01T00:00:00.000Z"),
  };

  it("returns insufficient data when history is short", () => {
    const result = calculateForecast({
      ...base,
      daysElapsed: 3,
      hasEnoughHistory: false,
    });
    expect(result.dataStatus).toBe(FinancialPlanDataStatus.INSUFFICIENT_DATA);
    expect(result.trackStatus).toBe(FinancialPlanTrackStatus.INSUFFICIENT_DATA);
    expect(result.expectedSpendingMinor).toBeNull();
  });

  it("marks ahead when underspending", () => {
    const result = calculateForecast({
      ...base,
      daysElapsed: 15,
      plannedSpendToDateMinor: 3000n,
      actualSpendToDateMinor: 2000n,
      hasEnoughHistory: true,
    });
    expect(result.trackStatus).toBe(FinancialPlanTrackStatus.AHEAD);
    expect(result.onTrack).toBe(true);
    expect(result.expectedSpendingMinor).not.toBeNull();
  });

  it("marks behind when overspending", () => {
    const result = calculateForecast({
      ...base,
      daysElapsed: 15,
      plannedSpendToDateMinor: 3000n,
      actualSpendToDateMinor: 4500n,
      hasEnoughHistory: true,
    });
    expect(result.trackStatus).toBe(FinancialPlanTrackStatus.BEHIND);
    expect(result.onTrack).toBe(false);
  });

  it("marks on track near plan", () => {
    const result = calculateForecast({
      ...base,
      daysElapsed: 15,
      plannedSpendToDateMinor: 3000n,
      actualSpendToDateMinor: 3000n,
      actualSavingsToDateMinor: toMinorUnits(50_000),
      accumulatedMinor: toMinorUnits(80_000),
      targetAmountMinor: toMinorUnits(100_000),
      hasEnoughHistory: true,
    });
    expect(result.trackStatus).toBe(FinancialPlanTrackStatus.ON_TRACK);
  });
});
