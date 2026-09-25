import { Injectable } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { FinancialPlanService } from "src/financial-plan/financial-plan.service";
import type { AiTool } from "./ai-tool.interface";
import { AI_EMPTY_PARAMETERS } from "./ai-tool-parameters";
import { runFinancialPlanTool } from "./run-financial-plan-tool";

/** Read-only tool: deterministic plan forecast. */
@Injectable()
export class GetPlanForecastTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_PLAN_FORECAST;
  readonly description =
    "Get the deterministic financial plan forecast: on-track status, expected spending/savings, and projected goal completion. May return insufficient_data.";
  readonly parameters = AI_EMPTY_PARAMETERS;

  constructor(private readonly planService: FinancialPlanService) {}

  execute(ctx: AiToolContext): Promise<AiToolResult> {
    return runFinancialPlanTool(() =>
      this.planService.getForecast(ctx.userId),
    );
  }
}
