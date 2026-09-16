import { AgentOrchestrator } from "./agent.orchestrator";
import type {
  AiChatStreamEvent,
  LlmProvider,
  LlmRequest,
  LlmResponse,
} from "src/core/types/ai.types";
import { AiToolRegistry } from "./tools/ai-tool.registry";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";

describe("AgentOrchestrator", () => {
  const userId = "user-1";

  function createOrchestrator(options: {
    llm: LlmProvider;
    registry: Pick<AiToolRegistry, "getDeclarations" | "execute">;
  }) {
    return new AgentOrchestrator(
      options.llm,
      options.registry as AiToolRegistry,
    );
  }

  it("returns a normal response without tools", async () => {
    const llm: LlmProvider = {
      generate: jest.fn().mockResolvedValue({
        interactionId: "i-1",
        text: "Your balance is fine.",
        functionCalls: [],
      } satisfies LlmResponse),
    };
    const registry = {
      getDeclarations: jest.fn().mockReturnValue([]),
      execute: jest.fn(),
    };

    const orchestrator = createOrchestrator({ llm, registry });
    const result = await orchestrator.chat(userId, {
      message: "How am I doing?",
    });

    expect(result.reply).toBe("Your balance is fine.");
    expect(result.conversationId).toBe("i-1");
    expect(registry.execute).not.toHaveBeenCalled();
  });

  it("executes a tool call and returns the final reply", async () => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        interactionId: "i-1",
        text: null,
        functionCalls: [
          {
            id: "call-1",
            name: "get_balance",
            arguments: {},
          },
        ],
      } satisfies LlmResponse)
      .mockResolvedValueOnce({
        interactionId: "i-2",
        text: "Total balance is 100 UAH.",
        functionCalls: [],
      } satisfies LlmResponse);

    const llm: LlmProvider = { generate };
    const registry = {
      getDeclarations: jest.fn().mockReturnValue([
        {
          type: "function",
          name: "get_balance",
          description: "balances",
          parameters: { type: "object", properties: {} },
        },
      ]),
      execute: jest.fn().mockResolvedValue({
        ok: true,
        data: { totalBalance: 100 },
      }),
    };

    const orchestrator = createOrchestrator({ llm, registry });
    const result = await orchestrator.chat(userId, {
      message: "What is my balance?",
    });

    expect(registry.execute).toHaveBeenCalledWith(
      "get_balance",
      { userId },
      {},
    );
    expect(result.reply).toBe("Total balance is 100 UAH.");
    expect(result.toolsUsed).toEqual(["get_balance"]);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it("returns invalid-tool errors to the model instead of crashing", async () => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        interactionId: "i-1",
        text: null,
        functionCalls: [{ id: "c1", name: "drop_database", arguments: {} }],
      })
      .mockResolvedValueOnce({
        interactionId: "i-2",
        text: "I cannot do that.",
        functionCalls: [],
      });

    const llm: LlmProvider = { generate };
    const registry = {
      getDeclarations: jest.fn().mockReturnValue([]),
      execute: jest.fn().mockResolvedValue({
        ok: false,
        error: AI_ERROR_MESSAGES.INVALID_TOOL,
      }),
    };

    const orchestrator = createOrchestrator({ llm, registry });
    const result = await orchestrator.chat(userId, { message: "hack me" });
    expect(result.reply).toBe("I cannot do that.");
  });

  it("feeds tool execution failures back to the model", async () => {
    const generate = jest
      .fn()
      .mockResolvedValueOnce({
        interactionId: "i-1",
        text: null,
        functionCalls: [{ id: "c1", name: "get_balance", arguments: {} }],
      })
      .mockResolvedValueOnce({
        interactionId: "i-2",
        text: "I could not load balances.",
        functionCalls: [],
      });

    const llm: LlmProvider = { generate };
    const registry = {
      getDeclarations: jest.fn().mockReturnValue([]),
      execute: jest.fn().mockResolvedValue({
        ok: false,
        error: "Account not found",
      }),
    };

    const orchestrator = createOrchestrator({ llm, registry });
    const result = await orchestrator.chat(userId, { message: "balance?" });

    expect(result.reply).toBe("I could not load balances.");
    const secondCall = generate.mock.calls[1] as [LlmRequest] | undefined;
    expect(secondCall?.[0].functionResults).toEqual([
      {
        name: "get_balance",
        callId: "c1",
        result: { ok: false, error: "Account not found" },
      },
    ]);
  });

  it("stops when max tool iterations are exceeded", async () => {
    process.env.AI_MAX_TOOL_ITERATIONS = "1";

    const llm: LlmProvider = {
      generate: jest.fn().mockResolvedValue({
        interactionId: "i-1",
        text: null,
        functionCalls: [{ id: "c1", name: "get_balance", arguments: {} }],
      }),
    };
    const registry = {
      getDeclarations: jest.fn().mockReturnValue([]),
      execute: jest.fn().mockResolvedValue({ ok: true, data: {} }),
    };

    const orchestrator = createOrchestrator({ llm, registry });
    await expect(
      orchestrator.chat(userId, { message: "loop forever" }),
    ).rejects.toMatchObject({
      message: AI_ERROR_MESSAGES.MAX_TOOL_ITERATIONS,
    });

    delete process.env.AI_MAX_TOOL_ITERATIONS;
  });

  it("never passes model-controlled userId into tools", async () => {
    const llm: LlmProvider = {
      generate: jest
        .fn()
        .mockResolvedValueOnce({
          interactionId: "i-1",
          text: null,
          functionCalls: [
            {
              id: "c1",
              name: "get_balance",
              arguments: { userId: "attacker" },
            },
          ],
        })
        .mockResolvedValueOnce({
          interactionId: "i-2",
          text: "ok",
          functionCalls: [],
        }),
    };
    const execute = jest.fn().mockResolvedValue({ ok: true, data: {} });
    const registry = {
      getDeclarations: jest.fn().mockReturnValue([]),
      execute,
    };

    const orchestrator = createOrchestrator({ llm, registry });
    await orchestrator.chat(userId, { message: "balance" });

    expect(execute).toHaveBeenCalledWith(
      "get_balance",
      { userId: "user-1" },
      { userId: "attacker" },
    );
  });

  it("streams status, text deltas, and done events", async () => {
    const llm: LlmProvider = {
      generate: jest.fn().mockResolvedValue({
        interactionId: "i-1",
        text: "Hello",
        functionCalls: [],
      }),
      generateStream: jest.fn().mockImplementation(async function* () {
        await Promise.resolve();
        yield { type: "text_delta", text: "Hel" };
        yield { type: "text_delta", text: "lo" };
        yield {
          type: "final",
          interactionId: "i-stream",
          text: "Hello",
          functionCalls: [],
        };
      }),
    };
    const registry = {
      getDeclarations: jest.fn().mockReturnValue([]),
      execute: jest.fn(),
    };

    const orchestrator = createOrchestrator({ llm, registry });
    const events: AiChatStreamEvent[] = [];
    for await (const event of orchestrator.chatStream(userId, {
      message: "hi",
    })) {
      events.push(event);
    }

    expect(events[0]).toEqual({ type: "status", message: "Thinking..." });
    expect(events).toContainEqual({ type: "text_delta", text: "Hel" });
    expect(events).toContainEqual({ type: "text_delta", text: "lo" });
    expect(events[events.length - 1]).toEqual({
      type: "done",
      reply: "Hello",
      conversationId: "i-stream",
      toolsUsed: undefined,
    });
  });
});
