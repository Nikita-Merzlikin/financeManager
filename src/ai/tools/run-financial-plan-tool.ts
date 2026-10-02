import { NotFoundException } from "@nestjs/common";
import { FINANCIAL_PLAN_ERROR_MESSAGES } from "src/core/constants/financial-plan-errors.constants";
import type { AiToolResult } from "src/core/types/ai.types";
import { errorResult, okResult } from "./ai-tool-result";

/**
 * Runs a financial-plan tool action and maps missing-plan NotFound
 * to a safe tool error payload for the model.
 */
export async function runFinancialPlanTool<T>(
  action: () => Promise<T>,
): Promise<AiToolResult> {
  try {
    return okResult(await action());
  } catch (error) {
    if (error instanceof NotFoundException) {
      return errorResult(FINANCIAL_PLAN_ERROR_MESSAGES.PLAN_NOT_FOUND);
    }
    throw error;
  }
}
