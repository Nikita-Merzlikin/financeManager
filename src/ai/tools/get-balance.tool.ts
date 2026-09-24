import { Injectable } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { AccountsService } from "src/finance/accounts.service";
import type { AiTool } from "./ai-tool.interface";
import { AI_EMPTY_PARAMETERS } from "./ai-tool-parameters";
import { okResult } from "./ai-tool-result";

/** Tool: list account balances for the authenticated user. */
@Injectable()
export class GetBalanceTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_BALANCE;
  readonly description =
    "List the authenticated user's accounts with balances, currency, type, and activity status. Totals are grouped by currency.";
  readonly parameters = AI_EMPTY_PARAMETERS;

  constructor(private readonly accountsService: AccountsService) {}

  async execute(ctx: AiToolContext): Promise<AiToolResult> {
    const accounts = await this.accountsService.list(ctx.userId);
    const active = accounts.filter((account) => account.isActive);

    // Never sum mixed currencies into one number.
    const totalsByCurrency = active.reduce<Record<string, number>>(
      (totals, account) => {
        totals[account.currency] =
          (totals[account.currency] ?? 0) + account.balance;
        return totals;
      },
      {},
    );

    const currencies = Object.keys(totalsByCurrency);
    const singleCurrency = currencies.length === 1 ? currencies[0] : null;

    return okResult({
      totalsByCurrency,
      totalBalance: singleCurrency
        ? totalsByCurrency[singleCurrency]
        : undefined,
      currency: singleCurrency ?? undefined,
      note:
        currencies.length > 1
          ? "Accounts use multiple currencies. Use totalsByCurrency; do not add different currencies together."
          : undefined,
      accounts: active,
    });
  }
}
