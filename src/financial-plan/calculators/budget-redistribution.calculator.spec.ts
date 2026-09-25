import { FinancialPlanPeriodStatus } from "src/core/enums/financial-plan.enums";
import { redistributeBudget } from "./budget-redistribution.calculator";

describe("budget-redistribution.calculator", () => {
  const today = "2026-09-02";

  function slots(planned: bigint, from: string, count: number) {
    return Array.from({ length: count }, (_, i) => {
      const day = 1 + i;
      const date = `2026-09-${String(day).padStart(2, "0")}`;
      return {
        date,
        plannedMinor: planned,
        locked: date < today,
      };
    });
  }

  it("redistributes after overspending without changing history", () => {
    const days = slots(100n, "2026-09-01", 3);
    const actuals = new Map<string, bigint>([
      ["2026-09-01", 130n],
      ["2026-09-02", 0n],
      ["2026-09-03", 0n],
    ]);

    const result = redistributeBudget({ days, actualsByDate: actuals, today });

    expect(result[0].plannedMinor).toBe(100n);
    expect(result[0].locked).toBe(true);
    expect(result[0].status).toBe(FinancialPlanPeriodStatus.OVER_BUDGET);

    // Pool 300 - actual history 130 = 170 for today+future (2 days)
    expect(result[1].plannedMinor + result[2].plannedMinor).toBe(170n);
  });

  it("redistributes after underspending", () => {
    const days = slots(100n, "2026-09-01", 3);
    const actuals = new Map<string, bigint>([["2026-09-01", 70n]]);

    const result = redistributeBudget({ days, actualsByDate: actuals, today });
    expect(result[1].plannedMinor + result[2].plannedMinor).toBe(230n);
  });

  it("handles multiple overspending days", () => {
    const todayMulti = "2026-09-03";
    const days = [
      { date: "2026-09-01", plannedMinor: 100n, locked: true },
      { date: "2026-09-02", plannedMinor: 100n, locked: true },
      { date: "2026-09-03", plannedMinor: 100n, locked: false },
      { date: "2026-09-04", plannedMinor: 100n, locked: false },
    ];
    const actuals = new Map<string, bigint>([
      ["2026-09-01", 150n],
      ["2026-09-02", 120n],
    ]);

    const result = redistributeBudget({
      days,
      actualsByDate: actuals,
      today: todayMulti,
    });

    // 400 - 270 = 130 for 2 adjustable days
    expect(result[2].plannedMinor + result[3].plannedMinor).toBe(130n);
    expect(result[0].plannedMinor).toBe(100n);
    expect(result[1].plannedMinor).toBe(100n);
  });

  it("assigns zero when no future pool remains", () => {
    const days = [
      { date: "2026-09-01", plannedMinor: 100n, locked: true },
      { date: "2026-09-02", plannedMinor: 100n, locked: false },
    ];
    const actuals = new Map<string, bigint>([["2026-09-01", 250n]]);
    const result = redistributeBudget({ days, actualsByDate: actuals, today });
    expect(result[1].plannedMinor).toBe(0n);
  });

  it("handles final day with no future days", () => {
    const lastDay = "2026-09-01";
    const days = [{ date: lastDay, plannedMinor: 100n, locked: false }];
    const actuals = new Map<string, bigint>([[lastDay, 40n]]);
    const result = redistributeBudget({
      days,
      actualsByDate: actuals,
      today: lastDay,
    });
    expect(result).toHaveLength(1);
    expect(result[0].plannedMinor).toBe(100n);
    expect(result[0].remainingMinor).toBe(60n);
  });
});
