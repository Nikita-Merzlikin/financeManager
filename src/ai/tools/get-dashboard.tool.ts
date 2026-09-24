import { Injectable } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import { AiPeriodArgsDto } from "src/core/dto/ai.dto";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { DashboardService } from "src/finance/dashboard.service";
import type { AiTool } from "./ai-tool.interface";
import { AI_PERIOD_PARAMETERS } from "./ai-tool-parameters";
import { okResult } from "./ai-tool-result";
import { parseToolArgs } from "./parse-tool-args";

/** Tool: period dashboard summary (best for spend-by-category questions). */
@Injectable()
export class GetDashboardTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_DASHBOARD;
  readonly description =
    "Get dashboard summary for a period: total balance, income, expenses, savings, net, daily series, and totals by category. Ideal for spend-by-category questions.";
  readonly parameters = AI_PERIOD_PARAMETERS;

  constructor(private readonly dashboardService: DashboardService) {}

  async execute(
    ctx: AiToolContext,
    args: Record<string, unknown> = {},
  ): Promise<AiToolResult> {
    const dto = await parseToolArgs(AiPeriodArgsDto, args);
    const dashboard = await this.dashboardService.getDashboard(
      ctx.userId,
      dto.from,
      dto.to,
    );

    return okResult(dashboard);
  }
}
