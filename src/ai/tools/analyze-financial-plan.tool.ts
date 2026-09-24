import { Injectable, NotFoundException } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import { FINANCIAL_PLAN_ERROR_MESSAGES } from "src/core/constants/financial-plan-errors.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { FinancialPlanService } from "src/financial-plan/financial-plan.service";
import type { AiTool } from "./ai-tool.interface";
import { okResult } from "./ai-tool-result";

/**
 * Read-only tool: plan + forecast + categories snapshot for the model to reason about.
 * Does not mutate the plan.
 */
@Injectable()
export class AnalyzeFinancialPlanTool implements AiTool {
  readonly name = AI_TOOL_NAMES.ANALYZE_FINANCIAL_PLAN;
  readonly description =
    "Load active plan overview, categories, forecast, and baseline savings vs historical spending for analysis. Read-only.";
  readonly parameters = {
    type: "object" as const,
    properties: {},
  };

  constructor(private readonly planService: FinancialPlanService) {}

  async execute(ctx: AiToolContext): Promise<AiToolResult> {
    try {
      const [plan, forecast, baseline, categories] = await Promise.all([
        this.planService.getActive(ctx.userId),
        this.planService.getForecast(ctx.userId),
        this.planService.getBaseline(ctx.userId),
        this.planService.getCategories(ctx.userId),
      ]);
      return okResult({ plan, forecast, baseline, categories });
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
