import { BadRequestException } from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import { TransactionType } from "src/core/enums/finance.enums";
import { CreateTransactionTool } from "./create-transaction.tool";
import type { TransactionsService } from "src/finance/transactions.service";

describe("CreateTransactionTool", () => {
  it("creates a transaction with authenticated userId", async () => {
    const create = jest.fn().mockResolvedValue({
      id: "tx-1",
      amount: 10,
    });
    const tool = new CreateTransactionTool({
      create,
    } as unknown as TransactionsService);

    const result = await tool.execute(
      { userId: "user-1" },
      {
        accountId: "11111111-1111-1111-1111-111111111111",
        type: TransactionType.EXPENSE,
        amount: 10,
        description: "Coffee",
      },
    );

    expect(create).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({
        accountId: "11111111-1111-1111-1111-111111111111",
        type: TransactionType.EXPENSE,
        amount: 10,
        description: "Coffee",
      }),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects invalid arguments", async () => {
    const tool = new CreateTransactionTool({
      create: jest.fn(),
    } as unknown as TransactionsService);

    await expect(
      tool.execute({ userId: "user-1" }, { amount: -1 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      tool.execute({ userId: "user-1" }, { amount: -1 }),
    ).rejects.toMatchObject({
      message: AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS,
    });
  });
});
