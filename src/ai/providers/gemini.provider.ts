import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  BadRequestException,
} from "@nestjs/common";
import { GoogleGenAI } from "@google/genai";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import type {
  LlmFunctionCall,
  LlmProvider,
  LlmRequest,
  LlmResponse,
} from "src/core/types/ai.types";
import { getAiConfig } from "../ai.config";

type InteractionStep = {
  type?: string;
  id?: string;
  name?: string;
  arguments?: Record<string, unknown>;
  content?: Array<{ type?: string; text?: string }>;
};

type InteractionLike = {
  id?: string;
  output_text?: string;
  steps?: InteractionStep[];
};

/** Adapter over Google GenAI Interactions API (@google/genai). */
@Injectable()
export class GeminiProvider implements LlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const { apiKey } = getAiConfig();
    if (!apiKey) {
      throw new ServiceUnavailableException(
        AI_ERROR_MESSAGES.GEMINI_API_KEY_MISSING,
      );
    }

    const client = new GoogleGenAI({ apiKey });

    const payload: Record<string, unknown> = {
      model: request.model,
      tools: request.tools,
      system_instruction: request.systemInstruction,
    };

    // Continue a turn with tool results, continue chat, or start a new interaction.
    if (request.previousInteractionId && request.functionResults?.length) {
      payload.previous_interaction_id = request.previousInteractionId;
      payload.input = request.functionResults.map((item) => ({
        type: "function_result",
        name: item.name,
        call_id: item.callId,
        result: [
          {
            type: "text",
            text: JSON.stringify(item.result),
          },
        ],
      }));
    } else if (request.previousInteractionId && request.userMessage) {
      payload.previous_interaction_id = request.previousInteractionId;
      payload.input = request.userMessage;
    } else {
      payload.input = request.userMessage ?? "";
    }

    try {
      const interaction = (await withTimeout(
        client.interactions.create(payload as never),
        request.timeoutMs,
      )) as InteractionLike;

      return this.mapResponse(interaction);
    } catch (error) {
      throw this.mapError(error);
    }
  }

  private mapResponse(interaction: InteractionLike): LlmResponse {
    const interactionId = interaction.id;
    if (!interactionId) {
      throw new ServiceUnavailableException(
        AI_ERROR_MESSAGES.MALFORMED_RESPONSE,
      );
    }

    const functionCalls: LlmFunctionCall[] = [];
    for (const step of interaction.steps ?? []) {
      if (step.type === "function_call" && step.name && step.id) {
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
      if (step.type === "function_call") continue;
      for (const block of step.content ?? []) {
        if (block.type === "text" && block.text) {
          parts.push(block.text);
        }
      }
    }
    const joined = parts.join("\n").trim();
    return joined.length > 0 ? joined : null;
  }

  private mapError(error: unknown): Error {
    const message =
      error instanceof Error ? error.message.toLowerCase() : String(error);

    this.logger.error(`Gemini request failed: ${message}`);

    if (message.includes("timeout")) {
      return new ServiceUnavailableException(AI_ERROR_MESSAGES.TIMEOUT);
    }
    if (message.includes("429") || message.includes("rate")) {
      return new BadRequestException(AI_ERROR_MESSAGES.GEMINI_RATE_LIMIT);
    }
    if (message.includes("quota") || message.includes("resource_exhausted")) {
      return new BadRequestException(AI_ERROR_MESSAGES.GEMINI_QUOTA);
    }
    if (
      error instanceof BadRequestException ||
      error instanceof ServiceUnavailableException
    ) {
      return error;
    }
    return new ServiceUnavailableException(
      AI_ERROR_MESSAGES.GEMINI_UNAVAILABLE,
    );
  }
}

/** Soft timeout wrapper so hung Gemini calls fail with a clear error. */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("timeout"));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      });
  });
}
