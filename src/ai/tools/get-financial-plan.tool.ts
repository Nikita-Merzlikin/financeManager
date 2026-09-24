import { Injectable, NotFoundException } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import { FINANCIAL_PLAN_ERROR_MESSAGES } from "src/core/constants/financial-plan-errors.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { FinancialPlanService } from "src/financial-plan/financial-plan.service";
import type { AiTool } from "./ai-tool.interface";
import { okResult } from "./ai-tool-result";

/** Read-only tool: active financial plan overview. */
@Injectable()
export class GetFinancialPlanTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_FINANCIAL_PLAN;
  readonly description =
    "Get the user's active financial plan overview: income, expenses, savings, goal progress, current period, and category limits.";
  readonly parameters = {
    type: "object" as const,
    properties: {},
  };

  constructor(private readonly planService: FinancialPlanService) {}

  async execute(ctx: AiToolContext): Promise<AiToolResult> {
    try {
      const plan = await this.planService.getActive(ctx.userId);
      return okResult(plan);
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
