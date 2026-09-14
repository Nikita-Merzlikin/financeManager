import { BadRequestException, Injectable } from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { DashboardService } from "src/finance/dashboard.service";
import type { AiTool } from "./ai-tool.interface";

@Injectable()
export class GetDashboardTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_DASHBOARD;
  readonly description =
    "Get dashboard summary for a period: total balance, income, expenses, savings, net, daily series, and totals by category. Ideal for spend-by-category questions.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      from: {
        type: "string",
        description: "Period start ISO-8601. Defaults to last 30 days.",
      },
      to: {
        type: "string",
        description: "Period end ISO-8601. Defaults to now.",
      },
    },
    required: [] as string[],
  };

  constructor(private readonly dashboardService: DashboardService) {}

  async execute(
    ctx: AiToolContext,
    args: Record<string, unknown>,
  ): Promise<AiToolResult> {
    const from = optionalString(args.from);
    const to = optionalString(args.to);

    if (from && Number.isNaN(Date.parse(from))) {
      throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
    }
    if (to && Number.isNaN(Date.parse(to))) {
      throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
    }

    const dashboard = await this.dashboardService.getDashboard(
      ctx.userId,
      from,
      to,
    );

    return { ok: true, data: dashboard };
  }
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
  }
  return value;
}
