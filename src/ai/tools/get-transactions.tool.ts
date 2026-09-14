import { BadRequestException, Injectable } from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import { TransactionType } from "src/core/enums/finance.enums";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { TransactionsService } from "src/finance/transactions.service";
import type { AiTool } from "./ai-tool.interface";

/** Tool: list transactions with optional date/category/type filters. */
@Injectable()
export class GetTransactionsTool implements AiTool {
  readonly name = AI_TOOL_NAMES.GET_TRANSACTIONS;
  readonly description =
    "List the authenticated user's transactions. Optional filters: from, to (ISO dates), categoryId, type (income|expense).";
  readonly parameters = {
    type: "object" as const,
    properties: {
      from: {
        type: "string",
        description: "Start date/time ISO-8601 inclusive",
      },
      to: {
        type: "string",
        description: "End date/time ISO-8601 inclusive",
      },
      categoryId: {
        type: "string",
        description: "Category UUID to filter by",
      },
      type: {
        type: "string",
        enum: [TransactionType.INCOME, TransactionType.EXPENSE],
        description: "Transaction type filter",
      },
    },
    required: [] as string[],
  };

  constructor(private readonly transactionsService: TransactionsService) {}

  async execute(
    ctx: AiToolContext,
    args: Record<string, unknown>,
  ): Promise<AiToolResult> {
    const from = optionalString(args.from);
    const to = optionalString(args.to);
    const categoryId = optionalString(args.categoryId);
    const type = optionalTransactionType(args.type);

    if (from && Number.isNaN(Date.parse(from))) {
      throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
    }
    if (to && Number.isNaN(Date.parse(to))) {
      throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
    }

    const transactions = await this.transactionsService.list(
      ctx.userId,
      from,
      to,
      { categoryId, type },
    );

    return {
      ok: true,
      data: {
        count: transactions.length,
        transactions,
      },
    };
  }
}

function optionalString(value: unknown): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value !== "string") {
    throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
  }
  return value;
}

function optionalTransactionType(value: unknown): TransactionType | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (value === TransactionType.INCOME || value === TransactionType.EXPENSE) {
    return value;
  }
  throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
}
