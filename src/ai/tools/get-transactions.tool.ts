import { Injectable } from "@nestjs/common";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import { AiGetTransactionsArgsDto } from "src/core/dto/ai.dto";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { TransactionsService } from "src/finance/transactions.service";
import type { AiTool } from "./ai-tool.interface";
import { AI_GET_TRANSACTIONS_PARAMETERS } from "./ai-tool-parameters";
import { okResult } from "./ai-tool-result";
import { parseToolArgs } from "./parse-tool-args";

/** Tool: list transactions with optional date/category/type filters. */
@Injectable()
export class GetTransactionsTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_TRANSACTIONS;
  readonly description =
    "List the authenticated user's transactions. Optional filters: from, to (ISO-8601), categoryId, type (income|expense).";
  readonly parameters = AI_GET_TRANSACTIONS_PARAMETERS;

  constructor(private readonly transactionsService: TransactionsService) {}

  async execute(
    ctx: AiToolContext,
    args: Record<string, unknown> = {},
  ): Promise<AiToolResult> {
    const dto = await parseToolArgs(AiGetTransactionsArgsDto, args);

    const transactions = await this.transactionsService.list(
      ctx.userId,
      dto.from,
      dto.to,
      { categoryId: dto.categoryId, type: dto.type },
    );

    return okResult({
      count: transactions.length,
      transactions,
    });
  }
}
