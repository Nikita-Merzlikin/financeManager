/** Shared AI/LLM types used by the orchestrator and providers. */

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

export interface LlmProvider {
  generate(request: LlmRequest): Promise<LlmResponse>;
}

export type AiToolContext = {
  userId: string;
};

export type AiToolResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
};
