import { HttpException, Injectable } from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import type {
  AiToolContext,
  AiToolResult,
  LlmToolDeclaration,
} from "src/core/types/ai.types";
import type { AiTool } from "./ai-tool.interface";
import { toToolDeclaration } from "./ai-tool.interface";
import { AnalyzeFinancialPlanTool } from "./analyze-financial-plan.tool";
import { CreateTransactionTool } from "./create-transaction.tool";
import { GetBalanceTool } from "./get-balance.tool";
import { GetCategoriesTool } from "./get-categories.tool";
import { GetDashboardTool } from "./get-dashboard.tool";
import { GetFinancialPlanTool } from "./get-financial-plan.tool";
import { GetPlanForecastTool } from "./get-plan-forecast.tool";
import { GetTransactionsTool } from "./get-transactions.tool";

/** Whitelist registry of AI tools backed by finance domain services. */
@Injectable()
export class AiToolRegistry {
  private readonly tools: Map<string, AiTool>;

  constructor(
    getBalanceTool: GetBalanceTool,
    getCategoriesTool: GetCategoriesTool,
    getTransactionsTool: GetTransactionsTool,
    getDashboardTool: GetDashboardTool,
    createTransactionTool: CreateTransactionTool,
    getFinancialPlanTool: GetFinancialPlanTool,
    getPlanForecastTool: GetPlanForecastTool,
    analyzeFinancialPlanTool: AnalyzeFinancialPlanTool,
  ) {
    const list: AiTool[] = [
      getBalanceTool,
      getCategoriesTool,
      getTransactionsTool,
      getDashboardTool,
      createTransactionTool,
      getFinancialPlanTool,
      getPlanForecastTool,
      analyzeFinancialPlanTool,
    ];
    this.tools = new Map(list.map((tool) => [tool.name, tool]));
  }

  getDeclarations(): LlmToolDeclaration[] {
    return Array.from(this.tools.values()).map(toToolDeclaration);
  }

  async execute(
    name: string,
    ctx: AiToolContext,
    args: Record<string, unknown>,
  ): Promise<AiToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return { ok: false, error: AI_ERROR_MESSAGES.INVALID_TOOL };
    }

    try {
      return await tool.execute(ctx, args);
    } catch (error) {
      // Return domain errors to the model instead of aborting the whole chat turn.
      if (error instanceof HttpException) {
        return { ok: false, error: extractHttpMessage(error) };
      }
      const message =
        error instanceof Error
          ? error.message
          : AI_ERROR_MESSAGES.TOOL_EXECUTION_FAILED;
      return { ok: false, error: message };
    }
  }
}

function extractHttpMessage(error: HttpException): string {
  const response = error.getResponse();
  if (typeof response === "string") return response;
  if (
    typeof response === "object" &&
    response !== null &&
    "message" in response
  ) {
    const message = (response as { message?: string | string[] }).message;
    if (Array.isArray(message)) return message.join(", ");
    if (typeof message === "string") return message;
  }
  return error.message;
}
