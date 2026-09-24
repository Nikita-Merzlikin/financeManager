import { FinancialPlanDataStatus } from "src/core/enums/financial-plan.enums";
import { calculateBaselineSavings } from "./baseline-savings.calculator";

describe("baseline-savings.calculator", () => {
  it("returns insufficient data without history", () => {
    const result = calculateBaselineSavings({
      historicalAverageMonthlyExpensesMinor: null,
      planPeriodExpensesMinor: 1000n,
      planPeriodDays: 10,
      hasEnoughHistory: false,
    });
    expect(result.dataStatus).toBe(FinancialPlanDataStatus.INSUFFICIENT_DATA);
    expect(result.savedVersusBaselineMinor).toBeNull();
  });

  it("computes savings versus baseline", () => {
    const result = calculateBaselineSavings({
      historicalAverageMonthlyExpensesMinor: 30_000_00n,
      planPeriodExpensesMinor: 10_000_00n,
      planPeriodDays: 15,
      hasEnoughHistory: true,
    });
    expect(result.dataStatus).toBe(FinancialPlanDataStatus.OK);
    expect(result.projectedMonthlyExpensesUnderPlanMinor).toBe(
      (10_000_00n * 30n) / 15n,
    );
    expect(result.savedVersusBaselineMinor).toBe(
      30_000_00n - (10_000_00n * 30n) / 15n,
    );
  });
});
