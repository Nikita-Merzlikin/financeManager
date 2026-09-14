import { BadRequestException, Injectable } from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import { AI_TOOL_NAMES } from "src/core/constants/ai.constants";
import { CreateTransactionDto } from "src/core/dto/finance.dto";
import { TransactionType } from "src/core/enums/finance.enums";
import type { AiToolContext, AiToolResult } from "src/core/types/ai.types";
import { TransactionsService } from "src/finance/transactions.service";
import type { AiTool } from "./ai-tool.interface";

/** Tool: create a manual transaction via TransactionsService (ownership enforced there). */
@Injectable()
export class CreateTransactionTool implements AiTool {
  readonly name = AI_TOOL_NAMES.CREATE_TRANSACTION;
  readonly description =
    "Create a manual transaction for an account owned by the authenticated user. Requires accountId, type, and amount.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      accountId: {
        type: "string",
        description: "UUID of the user's account",
      },
      type: {
        type: "string",
        enum: [TransactionType.INCOME, TransactionType.EXPENSE],
      },
      amount: {
        type: "number",
        description: "Amount in major currency units (> 0)",
      },
      categoryId: {
        type: "string",
        description: "Optional category UUID matching the transaction type",
      },
      currency: {
        type: "string",
        description: "Optional 3-letter currency code",
      },
      description: {
        type: "string",
        description: "Optional description",
      },
      occurredAt: {
        type: "string",
        description: "Optional ISO-8601 timestamp",
      },
    },
    required: ["accountId", "type", "amount"],
  };

  constructor(private readonly transactionsService: TransactionsService) {}

  async execute(
    ctx: AiToolContext,
    args: Record<string, unknown>,
  ): Promise<AiToolResult> {
    const dto = parseCreateTransactionArgs(args);
    const transaction = await this.transactionsService.create(ctx.userId, dto);
    return { ok: true, data: { transaction } };
  }
}

function parseCreateTransactionArgs(
  args: Record<string, unknown>,
): CreateTransactionDto {
  const accountId = args.accountId;
  const type = args.type;
  const amount = args.amount;

  if (typeof accountId !== "string" || !accountId) {
    throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
  }
  if (type !== TransactionType.INCOME && type !== TransactionType.EXPENSE) {
    throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
  }
  if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0) {
    throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
  }

  const dto = new CreateTransactionDto();
  dto.accountId = accountId;
  dto.type = type;
  dto.amount = amount;

  if (args.categoryId !== undefined && args.categoryId !== null) {
    if (typeof args.categoryId !== "string") {
      throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
    }
    dto.categoryId = args.categoryId;
  }
  if (args.currency !== undefined && args.currency !== null) {
    if (typeof args.currency !== "string") {
      throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
    }
    dto.currency = args.currency;
  }
  if (args.description !== undefined && args.description !== null) {
    if (typeof args.description !== "string") {
      throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
    }
    dto.description = args.description;
  }
  if (args.occurredAt !== undefined && args.occurredAt !== null) {
    if (
      typeof args.occurredAt !== "string" ||
      Number.isNaN(Date.parse(args.occurredAt))
    ) {
      throw new BadRequestException(AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS);
    }
    dto.occurredAt = args.occurredAt;
  }

  return dto;
}
