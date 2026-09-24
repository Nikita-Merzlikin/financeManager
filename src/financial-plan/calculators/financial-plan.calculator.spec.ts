import {
  FinancialPlanCategoryStatus,
  FinancialPlanPeriodStatus,
} from "src/core/enums/financial-plan.enums";
import {
  calculateBudgetBreakdown,
  calculateCategoryVariance,
  calculatePlanProgress,
  classifyPeriodStatus,
  daysInMonth,
  monthsUntil,
} from "./financial-plan.calculator";

describe("financial-plan.calculator", () => {
  describe("calculateBudgetBreakdown", () => {
    it("computes monthly, weekly, and daily spending budgets", () => {
      const asOf = new Date("2026-09-15T00:00:00.000Z");
      const result = calculateBudgetBreakdown({
        incomeMinor: 50_000_00n,
        mandatoryExpensesMinor: 10_000_00n,
        desiredSavingsMinor: 5_000_00n,
        targetAmountMinor: 100_000_00n,
        accumulatedTowardGoalMinor: 0n,
        targetDate: new Date("2027-03-15T00:00:00.000Z"),
        asOf,
        categoryLimitsMinor: 8_000_00n,
      });

      // 6 months → goal contribution = 10000000/6
      expect(result.goalContributionMonthlyMinor).toBe(1_666_666n);
      expect(result.plannedSavingsMonthlyMinor).toBe(5_000_00n);
      expect(result.monthlySpendingBudgetMinor).toBe(
        50_000_00n - 5_000_00n - 1_666_666n - 10_000_00n,
      );
      expect(result.discretionaryMonthlyMinor).toBe(
        result.monthlySpendingBudgetMinor - 8_000_00n,
      );
      expect(result.daysInCurrentMonth).toBe(daysInMonth(asOf));
      expect(result.dailySpendingBudgetMinor).toBe(
        result.monthlySpendingBudgetMinor / BigInt(result.daysInCurrentMonth),
      );
      expect(result.weeklySpendingBudgetMinor).toBe(
        result.dailySpendingBudgetMinor * 7n,
      );
    });

    it("never returns negative spending when constraints exceed income", () => {
      const result = calculateBudgetBreakdown({
        incomeMinor: 1_000_00n,
        mandatoryExpensesMinor: 900_00n,
        desiredSavingsMinor: 500_00n,
        targetAmountMinor: 10_000_00n,
        accumulatedTowardGoalMinor: 0n,
        targetDate: new Date("2027-01-01T00:00:00.000Z"),
        asOf: new Date("2026-09-01T00:00:00.000Z"),
        categoryLimitsMinor: 0n,
      });
      expect(result.monthlySpendingBudgetMinor).toBe(0n);
      expect(result.discretionaryMonthlyMinor).toBe(0n);
    });
  });

  describe("classifyPeriodStatus", () => {
    it("classifies under / on / over budget", () => {
      expect(classifyPeriodStatus(100n, 80n)).toBe(
        FinancialPlanPeriodStatus.UNDER_BUDGET,
      );
      expect(classifyPeriodStatus(100n, 100n)).toBe(
        FinancialPlanPeriodStatus.ON_BUDGET,
      );
      expect(classifyPeriodStatus(100n, 130n)).toBe(
        FinancialPlanPeriodStatus.OVER_BUDGET,
      );
    });
  });

  describe("calculateCategoryVariance", () => {
    it("handles limited and unlimited categories", () => {
      const limited = calculateCategoryVariance({
        categoryId: "c1",
        name: "Food",
        limitMinor: 8000_00n,
        actualMinor: 4200_00n,
        isMandatory: true,
      });
      expect(limited.status).toBe(FinancialPlanCategoryStatus.UNDER_LIMIT);
      expect(limited.remainingMinor).toBe(3800_00n);
      expect(limited.percentageUsed).toBe(52.5);

      const over = calculateCategoryVariance({
        categoryId: "c1",
        name: "Food",
        limitMinor: 8000_00n,
        actualMinor: 9000_00n,
        isMandatory: false,
      });
      expect(over.status).toBe(FinancialPlanCategoryStatus.OVER_LIMIT);

      const unlimited = calculateCategoryVariance({
        categoryId: "c2",
        name: "Other",
        limitMinor: null,
        actualMinor: 100_00n,
        isMandatory: false,
      });
      expect(unlimited.status).toBe(FinancialPlanCategoryStatus.UNLIMITED);
      expect(unlimited.remainingMinor).toBeNull();
    });
  });

  describe("calculatePlanProgress", () => {
    it("computes percentage and projected date", () => {
      const result = calculatePlanProgress({
        targetAmountMinor: 100_000_00n,
        accumulatedMinor: 25_000_00n,
        monthlySavingsMinor: 5_000_00n,
        asOf: new Date("2026-09-01T00:00:00.000Z"),
        targetDate: new Date("2027-09-01T00:00:00.000Z"),
      });
      expect(result.percentageComplete).toBe(25);
      expect(result.remainingMinor).toBe(75_000_00n);
      expect(result.projectedCompletionDate).toBeTruthy();
    });
  });

  describe("monthsUntil", () => {
    it("returns at least 1", () => {
      expect(
        monthsUntil(
          new Date("2026-09-01T00:00:00.000Z"),
          new Date("2026-09-15T00:00:00.000Z"),
        ),
      ).toBe(1);
    });
  });
});
