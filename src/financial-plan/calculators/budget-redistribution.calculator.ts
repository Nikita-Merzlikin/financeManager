import { FinancialPlanPeriodStatus } from "src/core/enums/financial-plan.enums";
import type {
  RedistributedDay,
  RedistributionInput,
} from "src/core/types/financial-plan.types";
import { classifyPeriodStatus } from "./financial-plan.calculator";

/**
 * Redistributes the remaining spending pool over unlocked days (today + future).
 *
 * Invariants:
 * - Never create money: future planned sum equals remaining pool exactly
 * - Never lose money: remainder minor units assigned to earliest days
 * - Never modify historical planned amounts (locked or date < today)
 * - Only unlocked days with date >= today receive new planned values
 *
 * Example: Day1 planned=100 actual=130, total pool=1000, 9 days left
 * → remaining = 870 → ~96.67/day on future slots
 */
export function redistributeBudget(
  input: RedistributionInput,
): RedistributedDay[] {
  const sorted = [...input.days].sort((a, b) => a.date.localeCompare(b.date));
  const totalPool = sorted.reduce((sum, day) => sum + day.plannedMinor, 0n);

  let consumedByHistory = 0n;
  for (const day of sorted) {
    if (day.date < input.today || day.locked) {
      // Historical (and any explicitly locked) days consume the pool via actual spend.
      // Planned on those days stays frozen for display.
      if (day.date < input.today) {
        consumedByHistory += input.actualsByDate.get(day.date) ?? 0n;
      }
    }
  }

  const remainingPool =
    totalPool > consumedByHistory ? totalPool - consumedByHistory : 0n;

  const adjustable = sorted.filter(
    (day) => !day.locked && day.date >= input.today,
  );

  const adjustedPlanned = new Map<string, bigint>();
  if (adjustable.length > 0) {
    const count = BigInt(adjustable.length);
    const base = remainingPool / count;
    let remainder = remainingPool - base * count;

    for (const day of adjustable) {
      let planned = base;
      if (remainder > 0n) {
        planned += 1n;
        remainder -= 1n;
      }
      adjustedPlanned.set(day.date, planned);
    }
  }

  return sorted.map((day) => {
    const actualMinor = input.actualsByDate.get(day.date) ?? 0n;
    const isHistorical = day.date < input.today || day.locked;
    const plannedMinor = isHistorical
      ? day.plannedMinor
      : (adjustedPlanned.get(day.date) ?? day.plannedMinor);

    const remainingMinor = plannedMinor - actualMinor;
    return {
      date: day.date,
      plannedMinor,
      actualMinor,
      remainingMinor,
      varianceMinor: remainingMinor,
      status: classifyPeriodStatus(plannedMinor, actualMinor),
      locked: isHistorical,
    };
  });
}

export function aggregatePeriod(days: RedistributedDay[]): {
  plannedMinor: bigint;
  actualMinor: bigint;
  remainingMinor: bigint;
  varianceMinor: bigint;
  savedMinor: bigint;
  status: FinancialPlanPeriodStatus;
} {
  const plannedMinor = days.reduce((s, d) => s + d.plannedMinor, 0n);
  const actualMinor = days.reduce((s, d) => s + d.actualMinor, 0n);
  const remainingMinor = plannedMinor - actualMinor;
  const savedMinor = remainingMinor > 0n ? remainingMinor : 0n;
  return {
    plannedMinor,
    actualMinor,
    remainingMinor,
    varianceMinor: remainingMinor,
    savedMinor,
    status: classifyPeriodStatus(plannedMinor, actualMinor),
  };
}
