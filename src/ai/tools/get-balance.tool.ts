import { Injectable } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { AccountsService } from "src/finance/accounts.service";
import type { AiTool } from "./ai-tool.interface";

@Injectable()
export class GetBalanceTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_BALANCE;
  readonly description =
    "List the authenticated user's accounts with balances, currency, type, and activity status.";
  readonly parameters = {
    type: "object" as const,
    properties: {},
    required: [] as string[],
  };

  constructor(private readonly accountsService: AccountsService) {}

  async execute(ctx: AiToolContext): Promise<AiToolResult> {
    const accounts = await this.accountsService.list(ctx.userId);
    const active = accounts.filter((account) => account.isActive);
    const totalBalance = active.reduce(
      (sum, account) => sum + account.balance,
      0,
    );
    return {
      ok: true,
      data: {
        totalBalance,
        accounts: active,
      },
    };
  }
}
