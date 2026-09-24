/** Shared AI/LLM types used by the orchestrator and providers. */

import { AiChatStreamEventType, LlmStreamChunkType } from "../enums/ai.enums";

export type LlmToolParameterSchema = {
  type: "object";
  properties: Record<string, Record<string, unknown>>;
  required?: string[];
};

export type LlmToolDeclaration = {
  type: "function";
  name: string;
  description: string;
  parameters: LlmToolParameterSchema;
};

export type LlmFunctionCall = {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type LlmFunctionResult = {
  name: string;
  callId: string;
  result: unknown;
};

export type LlmRequest = {
  model: string;
  systemInstruction: string;
  userMessage?: string;
  tools: LlmToolDeclaration[];
  previousInteractionId?: string;
  functionResults?: LlmFunctionResult[];
  timeoutMs: number;
};

export type LlmResponse = {
  interactionId: string;
  text: string | null;
  functionCalls: LlmFunctionCall[];
};

/** Streaming chunks from the LLM provider (text deltas and/or final frame). */
export type LlmStreamChunk =
  | { type: LlmStreamChunkType.TEXT_DELTA; text: string }
  | {
      type: LlmStreamChunkType.FINAL;
      interactionId: string;
      text: string | null;
      functionCalls: LlmFunctionCall[];
    };

export interface LlmProvider {
  generate(request: LlmRequest): Promise<LlmResponse>;
  /** Optional streaming; falls back to generate() when unimplemented. */
  generateStream?(request: LlmRequest): AsyncIterable<LlmStreamChunk>;
}

export type AiToolContext = {
  userId: string;
};

export type AiToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};

/** SSE events emitted by the streaming chat endpoint. */
export type AiChatStreamEvent =
  | { type: AiChatStreamEventType.STATUS; message: string }
  | { type: AiChatStreamEventType.TOOL_START; name: string }
  | {
      type: AiChatStreamEventType.TOOL_RESULT;
      name: string;
      result: AiToolResult;
    }
  | { type: AiChatStreamEventType.TEXT_DELTA; text: string }
  | {
      type: AiChatStreamEventType.DONE;
      reply: string;
      conversationId: string;
      toolsUsed?: string[];
    }
  | { type: AiChatStreamEventType.ERROR; message: string };
