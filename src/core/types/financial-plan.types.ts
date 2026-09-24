import type {
  FinancialPlanCategoryStatus,
  FinancialPlanDataStatus,
  FinancialPlanFrequency,
  FinancialPlanPeriodStatus,
  FinancialPlanRecommendationType,
  FinancialPlanStatus,
  FinancialPlanTrackStatus,
} from "src/core/enums/financial-plan.enums";

/** Input for core budget math (all amounts in minor units). */
export type FinancialPlanBudgetInput = {
  incomeMinor: bigint;
  mandatoryExpensesMinor: bigint;
  desiredSavingsMinor: bigint;
  targetAmountMinor: bigint;
  accumulatedTowardGoalMinor: bigint;
  targetDate: Date;
  asOf: Date;
  categoryLimitsMinor: bigint;
};

export type FinancialPlanBudgetBreakdown = {
  goalContributionMonthlyMinor: bigint;
  monthlySpendingBudgetMinor: bigint;
  discretionaryMonthlyMinor: bigint;
  plannedSavingsMonthlyMinor: bigint;
  daysInCurrentMonth: number;
  dailySpendingBudgetMinor: bigint;
  weeklySpendingBudgetMinor: bigint;
};

export type DayActual = {
  date: string; // YYYY-MM-DD
  actualMinor: bigint;
};

export type DayPlanSlot = {
  date: string;
  plannedMinor: bigint;
  locked: boolean;
};

export type RedistributionInput = {
  days: DayPlanSlot[];
  actualsByDate: Map<string, bigint>;
  today: string;
};

export type RedistributedDay = {
  date: string;
  plannedMinor: bigint;
  actualMinor: bigint;
  remainingMinor: bigint;
  varianceMinor: bigint;
  status: FinancialPlanPeriodStatus;
  locked: boolean;
};

export type CategorySpendInput = {
  categoryId: string;
  name: string;
  limitMinor: bigint | null;
  isMandatory: boolean;
  actualMinor: bigint;
};

export type CategoryVarianceResult = {
  categoryId: string;
  name: string;
  limitMinor: bigint | null;
  actualMinor: bigint;
  remainingMinor: bigint | null;
  percentageUsed: number | null;
  varianceMinor: bigint | null;
  status: FinancialPlanCategoryStatus;
  isMandatory: boolean;
};

export type PlanProgressInput = {
  targetAmountMinor: bigint;
  accumulatedMinor: bigint;
  monthlySavingsMinor: bigint;
  asOf: Date;
  targetDate: Date;
};

export type PlanProgressResult = {
  accumulatedMinor: bigint;
  targetAmountMinor: bigint;
  remainingMinor: bigint;
  percentageComplete: number;
  projectedCompletionDate: string | null;
};

export type ForecastInput = {
  daysElapsed: number;
  daysTotal: number;
  plannedSpendToDateMinor: bigint;
  actualSpendToDateMinor: bigint;
  plannedSavingsMonthlyMinor: bigint;
  actualSavingsToDateMinor: bigint;
  targetAmountMinor: bigint;
  accumulatedMinor: bigint;
  asOf: Date;
  targetDate: Date;
  hasEnoughHistory: boolean;
};

export type ForecastResult = {
  dataStatus: FinancialPlanDataStatus;
  trackStatus: FinancialPlanTrackStatus;
  expectedSpendingMinor: bigint | null;
  expectedSavingsMinor: bigint | null;
  expectedAccumulatedMinor: bigint | null;
  expectedCompletionDate: string | null;
  onTrack: boolean | null;
};

export type BaselineInput = {
  historicalAverageMonthlyExpensesMinor: bigint | null;
  planPeriodExpensesMinor: bigint;
  planPeriodDays: number;
  hasEnoughHistory: boolean;
};

export type BaselineResult = {
  dataStatus: FinancialPlanDataStatus;
  historicalAverageMonthlyExpensesMinor: bigint | null;
  projectedMonthlyExpensesUnderPlanMinor: bigint | null;
  savedVersusBaselineMinor: bigint | null;
};

export type FinancialPlanRecommendation = {
  type: FinancialPlanRecommendationType;
  categoryId?: string;
  currentValue?: number;
  suggestedValue?: number;
  reason: string;
};

export type FinancialPlanAiRecommendationPayload = {
  recommendations: FinancialPlanRecommendation[];
  summary?: string;
  suggestedSavings?: number;
  suggestedCategoryLimits?: Array<{
    categoryId: string;
    limit: number;
  }>;
};

export type StoredFinancialPlanShape = {
  id: string;
  userId: string;
  status: FinancialPlanStatus;
  incomeMinor: string;
  averageExpensesMinor: string;
  mandatoryExpensesMinor: string;
  desiredSavingsMinor: string;
  goal: string;
  targetAmountMinor: string;
  targetDate: Date;
  frequency: FinancialPlanFrequency;
  currency: string;
  startDate: Date;
  createdAt: Date;
  updatedAt: Date;
};
