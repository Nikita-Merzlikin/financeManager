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

function buildRegistry(...overrides: AiTool[]): AiToolRegistry {
  const defaults = [
    stubTool("get_balance"),
    stubTool("get_categories"),
    stubTool("get_transactions"),
    stubTool("get_dashboard"),
    stubTool("create_transaction"),
    stubTool("get_financial_plan"),
    stubTool("get_plan_forecast"),
    stubTool("analyze_financial_plan"),
  ];
  for (const tool of overrides) {
    const idx = defaults.findIndex((d) => d.name === tool.name);
    if (idx >= 0) defaults[idx] = tool;
  }
  return new AiToolRegistry(
    defaults[0] as never,
    defaults[1] as never,
    defaults[2] as never,
    defaults[3] as never,
    defaults[4] as never,
    defaults[5] as never,
    defaults[6] as never,
    defaults[7] as never,
  );
}

describe("AiToolRegistry", () => {
  it("rejects unknown tools with a safe result", async () => {
    const registry = buildRegistry();

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

    const registry = buildRegistry(failing);

    const result = await registry.execute("get_balance", { userId: "u1" }, {});
    expect(result.ok).toBe(false);
    expect(result.error).toContain("boom");
  });
});
