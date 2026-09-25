import { Injectable } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { FinancialPlanService } from "src/financial-plan/financial-plan.service";
import type { AiTool } from "./ai-tool.interface";
import { AI_EMPTY_PARAMETERS } from "./ai-tool-parameters";
import { runFinancialPlanTool } from "./run-financial-plan-tool";

/**
 * Read-only tool: plan + forecast + categories snapshot for the model to reason about.
 * Does not mutate the plan.
 */
@Injectable()
export class AnalyzeFinancialPlanTool implements AiTool {
  readonly name = AI_TOOL_NAMES.ANALYZE_FINANCIAL_PLAN;
  readonly description =
    "Load active plan overview, categories, forecast, and baseline savings vs historical spending for analysis. Read-only.";
  readonly parameters = AI_EMPTY_PARAMETERS;

  constructor(private readonly planService: FinancialPlanService) {}

  execute(ctx: AiToolContext): Promise<AiToolResult> {
    return runFinancialPlanTool(async () => {
      const [plan, forecast, baseline, categories] = await Promise.all([
        this.planService.getActive(ctx.userId),
        this.planService.getForecast(ctx.userId),
        this.planService.getBaseline(ctx.userId),
        this.planService.getCategories(ctx.userId),
      ]);
      return { plan, forecast, baseline, categories };
    });
  }
}
