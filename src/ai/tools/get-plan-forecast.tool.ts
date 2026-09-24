import { Injectable, NotFoundException } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import { FINANCIAL_PLAN_ERROR_MESSAGES } from "src/core/constants/financial-plan-errors.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { FinancialPlanService } from "src/financial-plan/financial-plan.service";
import type { AiTool } from "./ai-tool.interface";
import { okResult } from "./ai-tool-result";

/** Read-only tool: deterministic plan forecast. */
@Injectable()
export class GetPlanForecastTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_PLAN_FORECAST;
  readonly description =
    "Get the deterministic financial plan forecast: on-track status, expected spending/savings, and projected goal completion. May return insufficient_data.";
  readonly parameters = {
    type: "object" as const,
    properties: {},
  };

  constructor(private readonly planService: FinancialPlanService) {}

  async execute(ctx: AiToolContext): Promise<AiToolResult> {
    try {
      const forecast = await this.planService.getForecast(ctx.userId);
      return okResult(forecast);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return {
          ok: false,
          error: FINANCIAL_PLAN_ERROR_MESSAGES.PLAN_NOT_FOUND,
        };
      }
      throw error;
    }
  }
}
