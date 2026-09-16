import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import { LLM_PROVIDER } from "src/core/constants/ai.constants";
import { AiChatRequestDto, AiChatResponseDto } from "src/core/dto/ai.dto";
import type {
  AiChatStreamEvent,
  LlmFunctionResult,
  LlmProvider,
  LlmRequest,
  LlmStreamChunk,
} from "src/core/types/ai.types";
import { getAiConfig } from "./ai.config";
import { FINANCIAL_AGENT_SYSTEM_PROMPT } from "./prompts/financial-agent.prompt";
import { AiToolRegistry } from "./tools/ai-tool.registry";

/**
 * Agent loop: LLM <-> whitelist tools.
 * userId is injected from auth and never taken from model arguments.
 */
@Injectable()
export class AgentOrchestrator {
  private readonly logger = new Logger(AgentOrchestrator.name);

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly toolRegistry: AiToolRegistry,
  ) {}

  async chat(
    userId: string,
    dto: AiChatRequestDto,
  ): Promise<AiChatResponseDto> {
    let reply = "";
    let conversationId = "";
    let toolsUsed: string[] | undefined;

    for await (const event of this.chatStream(userId, dto)) {
      if (event.type === "text_delta") {
        reply += event.text;
      }
      if (event.type === "done") {
        reply = event.reply;
        conversationId = event.conversationId;
        toolsUsed = event.toolsUsed;
      }
      if (event.type === "error") {
        throw new BadRequestException(event.message);
      }
    }

    return {
      reply: reply || "I could not produce a response. Please try again.",
      conversationId,
      toolsUsed,
    };
  }

  /** Yields SSE-friendly events so clients can show progress and text sooner. */
  async *chatStream(
    userId: string,
    dto: AiChatRequestDto,
  ): AsyncGenerator<AiChatStreamEvent> {
    const config = getAiConfig();
    const message = dto.message.trim();
    if (!message) {
      yield { type: "error", message: AI_ERROR_MESSAGES.MESSAGE_REQUIRED };
      return;
    }
    if (message.length > config.maxInputLength) {
      yield { type: "error", message: AI_ERROR_MESSAGES.MESSAGE_TOO_LONG };
      return;
    }

    const tools = this.toolRegistry.getDeclarations();
    const toolsUsed: string[] = [];
    let interactionId = dto.conversationId;
    let functionResults: LlmFunctionResult[] | undefined;
    let pendingUserMessage: string | undefined = message;

    yield { type: "status", message: "Thinking..." };

    try {
      for (
        let iteration = 0;
        iteration <= config.maxToolIterations;
        iteration++
      ) {
        const request: LlmRequest = {
          model: config.model,
          systemInstruction: FINANCIAL_AGENT_SYSTEM_PROMPT,
          userMessage: pendingUserMessage,
          tools,
          previousInteractionId: interactionId,
          functionResults,
          timeoutMs: config.timeoutMs,
        };

        let streamedText = "";
        let finalChunk: Extract<LlmStreamChunk, { type: "final" }> | null =
          null;

        for await (const chunk of this.iterateLlm(request)) {
          if (chunk.type === "text_delta") {
            streamedText += chunk.text;
            yield { type: "text_delta", text: chunk.text };
          }
          if (chunk.type === "final") {
            finalChunk = chunk;
          }
        }

        if (!finalChunk) {
          yield {
            type: "error",
            message: AI_ERROR_MESSAGES.GEMINI_UNAVAILABLE,
          };
          return;
        }

        interactionId = finalChunk.interactionId;
        pendingUserMessage = undefined;
        functionResults = undefined;

        if (finalChunk.functionCalls.length === 0) {
          const reply =
            (finalChunk.text ?? streamedText).trim() ||
            "I could not produce a response. Please try again.";
          yield {
            type: "done",
            reply,
            conversationId: interactionId,
            toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
          };
          return;
        }

        if (iteration === config.maxToolIterations) {
          yield {
            type: "error",
            message: AI_ERROR_MESSAGES.MAX_TOOL_ITERATIONS,
          };
          return;
        }

        const results: LlmFunctionResult[] = [];
        for (const call of finalChunk.functionCalls) {
          toolsUsed.push(call.name);
          yield { type: "tool_start", name: call.name };
          this.logger.debug(`Executing tool ${call.name} for user ${userId}`);

          const result = await this.toolRegistry.execute(
            call.name,
            { userId },
            call.arguments,
          );
          yield { type: "tool_result", name: call.name, result };
          results.push({
            name: call.name,
            callId: call.id,
            result,
          });
        }
        functionResults = results;
        yield { type: "status", message: "Updating answer..." };
      }

      yield {
        type: "error",
        message: AI_ERROR_MESSAGES.MAX_TOOL_ITERATIONS,
      };
    } catch (error) {
      const messageText = extractErrorMessage(error);
      this.logger.error(`chatStream failed: ${messageText}`);
      yield { type: "error", message: messageText };
    }
  }

  private async *iterateLlm(
    request: LlmRequest,
  ): AsyncGenerator<LlmStreamChunk> {
    if (this.llm.generateStream) {
      yield* this.llm.generateStream(request);
      return;
    }

    const response = await this.llm.generate(request);
    if (response.text) {
      yield { type: "text_delta", text: response.text };
    }
    yield {
      type: "final",
      interactionId: response.interactionId,
      text: response.text,
      functionCalls: response.functionCalls,
    };
  }
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof HttpException) {
    const response = error.getResponse();
    if (typeof response === "string") return response;
    if (
      typeof response === "object" &&
      response !== null &&
      "message" in response
    ) {
      const message = (response as { message?: string | string[] }).message;
      if (Array.isArray(message)) return message.join(", ");
      if (typeof message === "string") return message;
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return AI_ERROR_MESSAGES.GEMINI_UNAVAILABLE;
}
