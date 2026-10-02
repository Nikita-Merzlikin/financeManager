import { FinancialPlanRecommendationType } from "src/core/enums/financial-plan.enums";
import type {
  FinancialPlanAiRecommendationPayload,
  FinancialPlanRecommendation,
} from "src/core/types/financial-plan.types";

const RECOMMENDATION_TYPE_VALUES = new Set<string>(
  Object.values(FinancialPlanRecommendationType),
);

export function isFinancialPlanRecommendationType(
  value: string,
): value is FinancialPlanRecommendationType {
  return RECOMMENDATION_TYPE_VALUES.has(value);
}

export function listFinancialPlanRecommendationTypes(): string {
  return [...RECOMMENDATION_TYPE_VALUES].join(", ");
}

/** Type guard + parser for Gemini recommendation JSON. */
export function parseAiRecommendationPayload(
  text: string | null,
): FinancialPlanAiRecommendationPayload | null {
  if (!text) return null;
  const jsonText = extractJsonObject(text.trim());
  if (!jsonText) return null;

  let raw: unknown;
  try {
    raw = JSON.parse(jsonText);
  } catch {
    return null;
  }

  if (!isRecord(raw) || !Array.isArray(raw.recommendations)) {
    return null;
  }

  const recommendations: FinancialPlanRecommendation[] = [];
  for (const item of raw.recommendations) {
    const parsed = parseRecommendationItem(item);
    if (!parsed) return null;
    recommendations.push(parsed);
  }

  const result: FinancialPlanAiRecommendationPayload = { recommendations };
  if (typeof raw.summary === "string") {
    result.summary = raw.summary;
  }
  if (typeof raw.suggestedSavings === "number") {
    result.suggestedSavings = raw.suggestedSavings;
  }

  const limits = parseSuggestedCategoryLimits(raw.suggestedCategoryLimits);
  if (limits === undefined) {
    return null;
  }
  if (limits !== null) {
    result.suggestedCategoryLimits = limits;
  }

  return result;
}

function parseRecommendationItem(
  item: unknown,
): FinancialPlanRecommendation | null {
  if (!isRecord(item)) return null;
  if (
    typeof item.type !== "string" ||
    !isFinancialPlanRecommendationType(item.type)
  ) {
    return null;
  }
  if (typeof item.reason !== "string" || item.reason.length === 0) {
    return null;
  }

  const recommendation: FinancialPlanRecommendation = {
    type: item.type,
    reason: item.reason,
  };
  if (typeof item.categoryId === "string") {
    recommendation.categoryId = item.categoryId;
  }
  if (typeof item.currentValue === "number") {
    recommendation.currentValue = item.currentValue;
  }
  if (typeof item.suggestedValue === "number") {
    recommendation.suggestedValue = item.suggestedValue;
  }
  return recommendation;
}

/** `null` = field absent; `undefined` = field present but invalid. */
function parseSuggestedCategoryLimits(
  value: unknown,
): Array<{ categoryId: string; limit: number }> | null | undefined {
  if (value === undefined) return null;
  if (!Array.isArray(value)) return undefined;

  const limits: Array<{ categoryId: string; limit: number }> = [];
  for (const entry of value) {
    if (
      !isRecord(entry) ||
      typeof entry.categoryId !== "string" ||
      typeof entry.limit !== "number"
    ) {
      return undefined;
    }
    limits.push({ categoryId: entry.categoryId, limit: entry.limit });
  }
  return limits;
}

function extractJsonObject(text: string): string | null {
  if (text.startsWith("{") && text.endsWith("}")) return text;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced?.[1]) {
    const inner = fenced[1].trim();
    if (inner.startsWith("{")) return inner;
  }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) return text.slice(start, end + 1);
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
