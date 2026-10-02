import { FinancialPlanDataStatus } from "src/core/enums/financial-plan.enums";
import { FINANCIAL_PLAN_FALLBACK_DAYS_IN_MONTH } from "src/core/constants/financial-plan.constants";
import { toMinorUnits } from "src/finance/finance.utils";
import { calculateBaselineSavings } from "./baseline-savings.calculator";

describe("baseline-savings.calculator", () => {
  it("returns insufficient data without history", () => {
    const result = calculateBaselineSavings({
      historicalAverageMonthlyExpensesMinor: null,
      planPeriodExpensesMinor: toMinorUnits(10),
      planPeriodDays: 10,
      hasEnoughHistory: false,
    });
    expect(result.dataStatus).toBe(FinancialPlanDataStatus.INSUFFICIENT_DATA);
    expect(result.savedVersusBaselineMinor).toBeNull();
  });

  it("computes savings versus baseline", () => {
    const historicalMonthly = toMinorUnits(30_000);
    const planPeriodExpenses = toMinorUnits(10_000);
    const planPeriodDays = 15;

    const result = calculateBaselineSavings({
      historicalAverageMonthlyExpensesMinor: historicalMonthly,
      planPeriodExpensesMinor: planPeriodExpenses,
      planPeriodDays,
      hasEnoughHistory: true,
    });

    const projectedMonthly =
      (planPeriodExpenses * BigInt(FINANCIAL_PLAN_FALLBACK_DAYS_IN_MONTH)) /
      BigInt(planPeriodDays);

    expect(result.dataStatus).toBe(FinancialPlanDataStatus.OK);
    expect(result.projectedMonthlyExpensesUnderPlanMinor).toBe(projectedMonthly);
    expect(result.savedVersusBaselineMinor).toBe(
      historicalMonthly - projectedMonthly,
    );
  });
});
