import { Injectable } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import { AiCreateTransactionArgsDto } from "src/core/dto/ai.dto";
import { CreateTransactionDto } from "src/core/dto/finance.dto";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { TransactionsService } from "src/finance/transactions.service";
import type { AiTool } from "./ai-tool.interface";
import { AI_CREATE_TRANSACTION_PARAMETERS } from "./ai-tool-parameters";
import { okResult } from "./ai-tool-result";
import { parseToolArgs } from "./parse-tool-args";

/** Tool: create a manual transaction via TransactionsService (ownership enforced there). */
@Injectable()
export class CreateTransactionTool implements AiTool {
  readonly name = AI_TOOL_NAMES.CREATE_TRANSACTION;
  readonly description =
    "Create a manual transaction for an account owned by the authenticated user. Requires accountId, type, and amount.";
  readonly parameters = AI_CREATE_TRANSACTION_PARAMETERS;

  constructor(private readonly transactionsService: TransactionsService) {}

  async execute(
    ctx: AiToolContext,
    args: Record<string, unknown> = {},
  ): Promise<AiToolResult> {
    const parsed = await parseToolArgs(AiCreateTransactionArgsDto, args);
    const dto = plainToInstance(CreateTransactionDto, parsed);
    const transaction = await this.transactionsService.create(ctx.userId, dto);
    return okResult({ transaction });
  }
}
