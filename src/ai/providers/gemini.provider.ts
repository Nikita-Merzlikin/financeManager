import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { GoogleGenAI, Interactions } from "@google/genai";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import type {
  LlmFunctionCall,
  LlmProvider,
  LlmRequest,
  LlmResponse,
  LlmStreamChunk,
  LlmToolDeclaration,
} from "src/core/types/ai.types";
import { getAiConfig } from "../ai.config";
import { GeminiApiError } from "./gemini-api.error";
import {
  GEMINI_DELTA_TYPE,
  GEMINI_INPUT_TYPE,
  GEMINI_SSE_EVENT,
  GEMINI_STEP_TYPE,
} from "./gemini.constants";

type InteractionSseEvent = Interactions.InteractionSSEEvent;
type InteractionStep = Interactions.Step;
type InteractionLike = {
  id?: string;
  output_text?: string;
  steps?: InteractionStep[];
};

/** Adapter over Google GenAI Interactions API (@google/genai). */
@Injectable()
export class GeminiProvider implements LlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly client: GoogleGenAI | null;

  constructor() {
    const { apiKey } = getAiConfig();
    this.client = apiKey ? new GoogleGenAI({ apiKey }) : null;
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const client = this.requireClient();
    const payload = this.buildNonStreamPayload(request);

    try {
      const result = await withTimeout(
        client.interactions.create(payload),
        request.timeoutMs,
      );
      if (isAsyncIterable(result)) {
        throw new GeminiApiError(AI_ERROR_MESSAGES.MALFORMED_RESPONSE);
      }
      return this.mapResponse(result);
    } catch (error) {
      throw this.toProviderError(error);
    }
  }

  /**
   * Stream text deltas when possible; always ends with a `final` chunk.
   * Falls back to non-streaming generate() only when nothing was emitted yet
   * (avoids duplicating text already sent to the client).
   */
  async *generateStream(request: LlmRequest): AsyncIterable<LlmStreamChunk> {
    const client = this.requireClient();
    const payload = this.buildStreamPayload(request);

    let emittedText = false;
    let interactionId = "";
    let text = "";
    const functionCalls: LlmFunctionCall[] = [];

    try {
      const result = await withTimeout(
        client.interactions.create(payload),
        request.timeoutMs,
      );

      if (!isAsyncIterable<InteractionSseEvent>(result)) {
        // SDK returned a completed interaction instead of a stream.
        const mapped = this.mapResponse(result);
        if (mapped.text) {
          yield { type: "text_delta", text: mapped.text };
        }
        yield {
          type: "final",
          interactionId: mapped.interactionId,
          text: mapped.text,
          functionCalls: mapped.functionCalls,
        };
        return;
      }

      for await (const event of withIdleTimeout(result, request.timeoutMs)) {
        this.consumeSseEvent(event, {
          onInteractionId: (id) => {
            interactionId = id;
          },
          onTextDelta: (delta) => {
            text += delta;
            emittedText = true;
          },
          onFunctionCall: (call) => {
            functionCalls.push(call);
          },
          onCompletedInteraction: (completed) => {
            const mapped = this.mapResponse(completed);
            interactionId = mapped.interactionId;
            if (mapped.text) {
              text = mapped.text;
            }
            if (mapped.functionCalls.length > 0) {
              functionCalls.splice(
                0,
                functionCalls.length,
                ...mapped.functionCalls,
              );
            }
          },
        });

        if (
          event.event_type === GEMINI_SSE_EVENT.STEP_DELTA &&
          event.delta.type === GEMINI_DELTA_TYPE.TEXT &&
          event.delta.text
        ) {
          yield { type: "text_delta", text: event.delta.text };
        }
      }

      if (!interactionId) {
        if (emittedText || functionCalls.length > 0) {
          // Already pushed content to the client — do not regenerate (would duplicate).
          this.logger.warn(
            "Gemini stream ended without interaction id after emitting content",
          );
          throw new GeminiApiError(AI_ERROR_MESSAGES.MALFORMED_RESPONSE);
        }

        yield* this.fallbackStream(request);
        return;
      }

      yield {
        type: "final",
        interactionId,
        text: text.trim() ? text : null,
        functionCalls,
      };
    } catch (error) {
      if (emittedText || functionCalls.length > 0) {
        // Partial stream already visible to the user — finalize, don't re-fetch text.
        this.logger.warn(
          `Gemini stream interrupted after partial output: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
        if (interactionId) {
          yield {
            type: "final",
            interactionId,
            text: text.trim() ? text : null,
            functionCalls,
          };
          return;
        }
        throw this.toProviderError(error);
      }

      this.logger.warn(
        `Gemini stream failed before output, falling back to generate(): ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      yield* this.fallbackStream(request);
    }
  }

  private async *fallbackStream(
    request: LlmRequest,
  ): AsyncGenerator<LlmStreamChunk> {
    const fallback = await this.generate(request);
    if (fallback.text) {
      yield { type: "text_delta", text: fallback.text };
    }
    yield {
      type: "final",
      interactionId: fallback.interactionId,
      text: fallback.text,
      functionCalls: fallback.functionCalls,
    };
  }

  private requireClient(): GoogleGenAI {
    if (!this.client) {
      throw new ServiceUnavailableException(
        AI_ERROR_MESSAGES.GEMINI_API_KEY_MISSING,
      );
    }
    return this.client;
  }

  private buildNonStreamPayload(
    request: LlmRequest,
  ): Interactions.CreateModelInteractionParamsNonStreaming {
    return {
      ...this.buildBasePayload(request),
      stream: false,
    };
  }

  private buildStreamPayload(
    request: LlmRequest,
  ): Interactions.CreateModelInteractionParamsStreaming {
    return {
      ...this.buildBasePayload(request),
      stream: true,
    };
  }

  private buildBasePayload(request: LlmRequest) {
    const base = {
      model: request.model,
      tools: request.tools.map(toGeminiTool),
      system_instruction: request.systemInstruction,
    };

    if (request.previousInteractionId && request.functionResults?.length) {
      return {
        ...base,
        previous_interaction_id: request.previousInteractionId,
        input: request.functionResults.map((item) => ({
          type: GEMINI_INPUT_TYPE.FUNCTION_RESULT,
          name: item.name,
          call_id: item.callId,
          result: [
            {
              type: GEMINI_INPUT_TYPE.TEXT,
              text: JSON.stringify(item.result),
            },
          ],
        })),
      };
    }

    if (request.previousInteractionId && request.userMessage) {
      return {
        ...base,
        previous_interaction_id: request.previousInteractionId,
        input: request.userMessage,
      };
    }

    return {
      ...base,
      input: request.userMessage ?? "",
    };
  }

  private consumeSseEvent(
    event: InteractionSseEvent,
    handlers: {
      onInteractionId: (id: string) => void;
      onTextDelta: (text: string) => void;
      onFunctionCall: (call: LlmFunctionCall) => void;
      onCompletedInteraction: (interaction: InteractionLike) => void;
    },
  ): void {
    if (
      event.event_type === GEMINI_SSE_EVENT.INTERACTION_CREATED ||
      event.event_type === GEMINI_SSE_EVENT.INTERACTION_COMPLETED
    ) {
      handlers.onInteractionId(event.interaction.id);
      if (event.event_type === GEMINI_SSE_EVENT.INTERACTION_COMPLETED) {
        handlers.onCompletedInteraction(event.interaction);
      }
      return;
    }

    if (event.event_type === GEMINI_SSE_EVENT.STEP_DELTA) {
      if (
        event.delta.type === GEMINI_DELTA_TYPE.TEXT &&
        typeof event.delta.text === "string"
      ) {
        handlers.onTextDelta(event.delta.text);
      }
      return;
    }

    if (event.event_type === GEMINI_SSE_EVENT.STEP_START) {
      const step = event.step;
      if (isFunctionCallStep(step)) {
        handlers.onFunctionCall({
          id: step.id,
          name: step.name,
          arguments:
            step.arguments && typeof step.arguments === "object"
              ? step.arguments
              : {},
        });
      }
    }
  }

  private mapResponse(interaction: InteractionLike): LlmResponse {
    const interactionId = interaction.id;
    if (!interactionId) {
      throw new GeminiApiError(AI_ERROR_MESSAGES.MALFORMED_RESPONSE);
    }

    const functionCalls: LlmFunctionCall[] = [];
    for (const step of interaction.steps ?? []) {
      if (isFunctionCallStep(step)) {
        functionCalls.push({
          id: step.id,
          name: step.name,
          arguments:
            step.arguments && typeof step.arguments === "object"
              ? step.arguments
              : {},
        });
      }
    }

    const text =
      interaction.output_text?.trim() ||
      this.extractTextFromSteps(interaction.steps ?? []) ||
      null;

    return {
      interactionId,
      text,
      functionCalls,
    };
  }

  private extractTextFromSteps(steps: InteractionStep[]): string | null {
    const parts: string[] = [];
    for (const step of steps) {
      if (isFunctionCallStep(step)) continue;
      if (!("content" in step) || !Array.isArray(step.content)) continue;
      for (const block of step.content) {
        if (
          block &&
          typeof block === "object" &&
          "type" in block &&
          block.type === GEMINI_DELTA_TYPE.TEXT &&
          "text" in block &&
          typeof block.text === "string"
        ) {
          parts.push(block.text);
        }
      }
    }
    const joined = parts.join("\n").trim();
    return joined.length > 0 ? joined : null;
  }

  private toProviderError(error: unknown): Error {
    if (
      error instanceof ServiceUnavailableException ||
      error instanceof GeminiApiError
    ) {
      return error;
    }
    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`Gemini request failed: ${message}`);
    return new GeminiApiError(message, error);
  }
}

function isFunctionCallStep(
  step: InteractionStep,
): step is Interactions.FunctionCallStep {
  return step.type === GEMINI_STEP_TYPE.FUNCTION_CALL;
}

/** Map our tool declarations onto the SDK Function tool shape without a blanket cast. */
function toGeminiTool(tool: LlmToolDeclaration): Interactions.Tool {
  return {
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  };
}

function isAsyncIterable<T>(value: unknown): value is AsyncIterable<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in value &&
    typeof Reflect.get(value, Symbol.asyncIterator) === "function"
  );
}

/** Soft timeout so hung Gemini calls fail with a clear error. */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new GeminiApiError("timeout"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(
          error instanceof Error ? error : new GeminiApiError(String(error)),
        );
      });
  });
}

/**
 * Idle timeout between stream chunks — covers hangs after the stream starts,
 * not only the initial create() handshake.
 */
async function* withIdleTimeout<T>(
  source: AsyncIterable<T>,
  timeoutMs: number,
): AsyncGenerator<T> {
  const iterator = source[Symbol.asyncIterator]();
  for (;;) {
    const next = await withTimeout(iterator.next(), timeoutMs);
    if (next.done) {
      return;
    }
    yield next.value;
  }
}
