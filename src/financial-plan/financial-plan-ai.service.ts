import {
  BadRequestException,
  Inject,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { getAiConfig } from "src/ai/ai.config";
import { LLM_PROVIDER } from "src/core/constants/ai.constants";
import { FINANCIAL_PLAN_ERROR_MESSAGES } from "src/core/constants/financial-plan-errors.constants";
import {
  FinancialPlanAiRecommendDto,
  FinancialPlanAiRecommendationResponseDto,
} from "src/core/dto/financial-plan.dto";
import { FinancialPlanRecommendationType } from "src/core/enums/financial-plan.enums";
import type { LlmProvider } from "src/core/types/ai.types";
import type {
  FinancialPlanAiRecommendationPayload,
  FinancialPlanRecommendation,
} from "src/core/types/financial-plan.types";
import { FinancialPlanService } from "./financial-plan.service";

const RECOMMENDATION_TYPES = new Set<string>(
  Object.values(FinancialPlanRecommendationType),
);

/**
 * Optional Gemini assistance for plan recommendations/analysis.
 * Never persists plans — caller must accept via FinancialPlanService.create/update.
 */
@Injectable()
export class FinancialPlanAiService {
  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly planService: FinancialPlanService,
  ) {}

  async recommend(
    _userId: string,
    dto: FinancialPlanAiRecommendDto,
  ): Promise<FinancialPlanAiRecommendationResponseDto> {
    const prompt = [
      "You are a personal finance advisor. Return ONLY valid JSON matching this shape:",
      JSON.stringify({
        recommendations: [
          {
            type: "reduce_category_limit",
            categoryId: "optional-uuid",
            currentValue: 9000,
            suggestedValue: 7500,
            reason: "string",
          },
        ],
        summary: "optional string",
        suggestedSavings: 5000,
        suggestedCategoryLimits: [{ categoryId: "uuid", limit: 8000 }],
      }),
      "Allowed recommendation types:",
      [...RECOMMENDATION_TYPES].join(", "),
      "User input:",
      JSON.stringify(dto),
      "Do not invent transactions. Recommend only — never claim the plan was saved.",
    ].join("\n");

    return this.callStructured(prompt);
  }

  async analyzeActive(
    userId: string,
  ): Promise<FinancialPlanAiRecommendationResponseDto> {
    const plan = await this.planService.getActive(userId);
    const forecast = await this.planService.getForecast(userId);
    const baseline = await this.planService.getBaseline(userId);

    const prompt = [
      "Analyze this active financial plan. Return ONLY valid JSON with recommendations.",
      "Allowed types:",
      [...RECOMMENDATION_TYPES].join(", "),
      "Plan snapshot:",
      JSON.stringify({ plan, forecast, baseline }),
      "Do not mutate anything. Deterministic numbers in the snapshot are authoritative.",
    ].join("\n");

    return this.callStructured(prompt);
  }

  private async callStructured(
    userMessage: string,
  ): Promise<FinancialPlanAiRecommendationResponseDto> {
    const config = getAiConfig();
    if (!config.apiKey) {
      throw new ServiceUnavailableException(
        FINANCIAL_PLAN_ERROR_MESSAGES.AI_UNAVAILABLE,
      );
    }

    let text: string | null;
    try {
      const response = await this.llm.generate({
        model: config.model,
        systemInstruction:
          "You output strict JSON only. No markdown fences. No prose outside JSON.",
        userMessage,
        tools: [],
        timeoutMs: config.timeoutMs,
      });
      text = response.text;
    } catch {
      throw new ServiceUnavailableException(
        FINANCIAL_PLAN_ERROR_MESSAGES.AI_UNAVAILABLE,
      );
    }

    const parsed = parseAiRecommendationPayload(text);
    if (!parsed) {
      throw new BadRequestException(
        FINANCIAL_PLAN_ERROR_MESSAGES.INVALID_AI_RESPONSE,
      );
    }
    return parsed;
  }
}

/** Type guard + parser for Gemini recommendation JSON. */
export function parseAiRecommendationPayload(
  text: string | null,
): FinancialPlanAiRecommendationPayload | null {
  if (!text) return null;
  const trimmed = text.trim();
  const jsonText = extractJsonObject(trimmed);
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
    if (!isRecord(item)) return null;
    if (typeof item.type !== "string" || !RECOMMENDATION_TYPES.has(item.type)) {
      return null;
    }
    if (typeof item.reason !== "string" || item.reason.length === 0) {
      return null;
    }
    const recommendation: FinancialPlanRecommendation = {
      type: item.type as FinancialPlanRecommendationType,
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
    recommendations.push(recommendation);
  }

  const result: FinancialPlanAiRecommendationPayload = { recommendations };
  if (typeof raw.summary === "string") {
    result.summary = raw.summary;
  }
  if (typeof raw.suggestedSavings === "number") {
    result.suggestedSavings = raw.suggestedSavings;
  }
  if (Array.isArray(raw.suggestedCategoryLimits)) {
    const limits: Array<{ categoryId: string; limit: number }> = [];
    for (const entry of raw.suggestedCategoryLimits) {
      if (
        !isRecord(entry) ||
        typeof entry.categoryId !== "string" ||
        typeof entry.limit !== "number"
      ) {
        return null;
      }
      limits.push({ categoryId: entry.categoryId, limit: entry.limit });
    }
    result.suggestedCategoryLimits = limits;
  }

  return result;
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
