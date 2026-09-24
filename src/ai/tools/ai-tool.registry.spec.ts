import { BadRequestException } from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import type { AiTool } from "./ai-tool.interface";
import { AiToolRegistry } from "./ai-tool.registry";

function stubTool(name: string, execute?: AiTool["execute"]): AiTool {
  return {
    name,
    description: `${name} stub`,
    parameters: { type: "object", properties: {} },
    execute:
      execute ??
      (() =>
        Promise.resolve({
          ok: true,
          data: {},
        })),
  };
}

describe("AiToolRegistry", () => {
  it("rejects unknown tools with a safe result", async () => {
    const registry = new AiToolRegistry(
      stubTool("get_balance") as never,
      stubTool("get_categories") as never,
      stubTool("get_transactions") as never,
      stubTool("get_dashboard") as never,
      stubTool("create_transaction") as never,
    );

    await expect(
      registry.execute("drop_database", { userId: "u1" }, {}),
    ).resolves.toEqual({
      ok: false,
      error: AI_ERROR_MESSAGES.INVALID_TOOL,
    });
  });

  it("maps domain HttpException to tool error payload", async () => {
    const failing = stubTool("get_balance", () => {
      throw new BadRequestException("boom");
    });

    const registry = new AiToolRegistry(
      failing as never,
      stubTool("get_categories") as never,
      stubTool("get_transactions") as never,
      stubTool("get_dashboard") as never,
      stubTool("create_transaction") as never,
    );

    const result = await registry.execute("get_balance", { userId: "u1" }, {});
    expect(result.ok).toBe(false);
    expect(result.error).toContain("boom");
  });
});
