import { FinancialPlanRecommendationType } from "src/core/enums/financial-plan.enums";
import { listFinancialPlanRecommendationTypes } from "./financial-plan-ai.parser";

const AI_JSON_SYSTEM_INSTRUCTION =
  "You output strict JSON only. No markdown fences. No prose outside JSON.";

const RECOMMENDATION_EXAMPLE = {
  recommendations: [
    {
      type: FinancialPlanRecommendationType.REDUCE_CATEGORY_LIMIT,
      categoryId: "optional-uuid",
      currentValue: 9000,
      suggestedValue: 7500,
      reason: "string",
    },
  ],
  summary: "optional string",
  suggestedSavings: 5000,
  suggestedCategoryLimits: [{ categoryId: "uuid", limit: 8000 }],
} as const;

export function buildRecommendPrompt(userInputJson: string): string {
  return [
    "You are a personal finance advisor. Return ONLY valid JSON matching this shape:",
    JSON.stringify(RECOMMENDATION_EXAMPLE),
    "Allowed recommendation types:",
    listFinancialPlanRecommendationTypes(),
    "User input:",
    userInputJson,
    "Do not invent transactions. Recommend only — never claim the plan was saved.",
  ].join("\n");
}

export function buildAnalyzePrompt(snapshotJson: string): string {
  return [
    "Analyze this active financial plan. Return ONLY valid JSON with recommendations.",
    "Allowed types:",
    listFinancialPlanRecommendationTypes(),
    "Plan snapshot:",
    snapshotJson,
    "Do not mutate anything. Deterministic numbers in the snapshot are authoritative.",
  ].join("\n");
}

export { AI_JSON_SYSTEM_INSTRUCTION };
