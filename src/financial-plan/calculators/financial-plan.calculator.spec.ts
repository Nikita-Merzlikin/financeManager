import {
  FinancialPlanCategoryStatus,
  FinancialPlanPeriodStatus,
} from "src/core/enums/financial-plan.enums";
import { toMinorUnits } from "src/finance/finance.utils";
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
      const income = toMinorUnits(50_000);
      const mandatory = toMinorUnits(10_000);
      const savings = toMinorUnits(5_000);
      const categoryLimits = toMinorUnits(8_000);
      const target = toMinorUnits(100_000);

      const result = calculateBudgetBreakdown({
        incomeMinor: income,
        mandatoryExpensesMinor: mandatory,
        desiredSavingsMinor: savings,
        targetAmountMinor: target,
        accumulatedTowardGoalMinor: 0n,
        targetDate: new Date("2027-03-15T00:00:00.000Z"),
        asOf,
        categoryLimitsMinor: categoryLimits,
      });

      // 6 months → goal contribution = target / 6
      const expectedGoal = target / 6n;
      expect(result.goalContributionMonthlyMinor).toBe(expectedGoal);
      expect(result.plannedSavingsMonthlyMinor).toBe(savings);
      expect(result.monthlySpendingBudgetMinor).toBe(
        income - savings - expectedGoal - mandatory,
      );
      expect(result.discretionaryMonthlyMinor).toBe(
        result.monthlySpendingBudgetMinor - categoryLimits,
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
        incomeMinor: toMinorUnits(1_000),
        mandatoryExpensesMinor: toMinorUnits(900),
        desiredSavingsMinor: toMinorUnits(500),
        targetAmountMinor: toMinorUnits(10_000),
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
        limitMinor: toMinorUnits(8_000),
        actualMinor: toMinorUnits(4_200),
        isMandatory: true,
      });
      expect(limited.status).toBe(FinancialPlanCategoryStatus.UNDER_LIMIT);
      expect(limited.remainingMinor).toBe(toMinorUnits(3_800));
      expect(limited.percentageUsed).toBe(52.5);

      const over = calculateCategoryVariance({
        categoryId: "c1",
        name: "Food",
        limitMinor: toMinorUnits(8_000),
        actualMinor: toMinorUnits(9_000),
        isMandatory: false,
      });
      expect(over.status).toBe(FinancialPlanCategoryStatus.OVER_LIMIT);

      const unlimited = calculateCategoryVariance({
        categoryId: "c2",
        name: "Other",
        limitMinor: null,
        actualMinor: toMinorUnits(100),
        isMandatory: false,
      });
      expect(unlimited.status).toBe(FinancialPlanCategoryStatus.UNLIMITED);
      expect(unlimited.remainingMinor).toBeNull();
    });
  });

  describe("calculatePlanProgress", () => {
    it("computes percentage and projected date", () => {
      const result = calculatePlanProgress({
        targetAmountMinor: toMinorUnits(100_000),
        accumulatedMinor: toMinorUnits(25_000),
        monthlySavingsMinor: toMinorUnits(5_000),
        asOf: new Date("2026-09-01T00:00:00.000Z"),
        targetDate: new Date("2027-09-01T00:00:00.000Z"),
      });
      expect(result.percentageComplete).toBe(25);
      expect(result.remainingMinor).toBe(toMinorUnits(75_000));
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
