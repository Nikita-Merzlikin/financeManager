import { Injectable } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { FinancialPlanService } from "src/financial-plan/financial-plan.service";
import type { AiTool } from "./ai-tool.interface";
import { AI_EMPTY_PARAMETERS } from "./ai-tool-parameters";
import { runFinancialPlanTool } from "./run-financial-plan-tool";

/** Read-only tool: active financial plan overview. */
@Injectable()
export class GetFinancialPlanTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_FINANCIAL_PLAN;
  readonly description =
    "Get the user's active financial plan overview: income, expenses, savings, goal progress, current period, and category limits.";
  readonly parameters = AI_EMPTY_PARAMETERS;

  constructor(private readonly planService: FinancialPlanService) {}

  execute(ctx: AiToolContext): Promise<AiToolResult> {
    return runFinancialPlanTool(() => this.planService.getActive(ctx.userId));
  }
}
