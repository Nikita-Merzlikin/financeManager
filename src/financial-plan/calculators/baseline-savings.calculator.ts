import { FinancialPlanDataStatus } from "src/core/enums/financial-plan.enums";
import type {
  BaselineInput,
  BaselineResult,
} from "src/core/types/financial-plan.types";
import { FINANCIAL_PLAN_FALLBACK_DAYS_IN_MONTH } from "src/core/constants/financial-plan.constants";

/**
 * Compares expenses under the plan vs historical average (baseline without a plan).
 * Does not invent a baseline when history is insufficient.
 */
export function calculateBaselineSavings(input: BaselineInput): BaselineResult {
  if (
    !input.hasEnoughHistory ||
    input.historicalAverageMonthlyExpensesMinor === null
  ) {
    return {
      dataStatus: FinancialPlanDataStatus.INSUFFICIENT_DATA,
      historicalAverageMonthlyExpensesMinor: null,
      projectedMonthlyExpensesUnderPlanMinor: null,
      savedVersusBaselineMinor: null,
    };
  }

  const days = Math.max(1, input.planPeriodDays);
  const projectedMonthlyExpensesUnderPlanMinor =
    (input.planPeriodExpensesMinor *
      BigInt(FINANCIAL_PLAN_FALLBACK_DAYS_IN_MONTH)) /
    BigInt(days);

  const savedVersusBaselineMinor =
    input.historicalAverageMonthlyExpensesMinor -
    projectedMonthlyExpensesUnderPlanMinor;

  return {
    dataStatus: FinancialPlanDataStatus.OK,
    historicalAverageMonthlyExpensesMinor:
      input.historicalAverageMonthlyExpensesMinor,
    projectedMonthlyExpensesUnderPlanMinor,
    savedVersusBaselineMinor,
  };
}
