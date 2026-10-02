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
import type { LlmProvider } from "src/core/types/ai.types";
import { parseAiRecommendationPayload } from "./financial-plan-ai.parser";
import {
  AI_JSON_SYSTEM_INSTRUCTION,
  buildAnalyzePrompt,
  buildRecommendPrompt,
} from "./financial-plan-ai.prompts";
import { FinancialPlanService } from "./financial-plan.service";

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
    return this.callStructured(buildRecommendPrompt(JSON.stringify(dto)));
  }

  async analyzeActive(
    userId: string,
  ): Promise<FinancialPlanAiRecommendationResponseDto> {
    const plan = await this.planService.getActive(userId);
    const forecast = await this.planService.getForecast(userId);
    const baseline = await this.planService.getBaseline(userId);

    return this.callStructured(
      buildAnalyzePrompt(JSON.stringify({ plan, forecast, baseline })),
    );
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
        systemInstruction: AI_JSON_SYSTEM_INSTRUCTION,
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
