import type {
  AiToolContext,
  AiToolResult,
  LlmToolDeclaration,
} from "src/core/types/ai.types";

/** Explicit tool contract — only registered tools can be invoked by the model. */
export interface AiTool {
  readonly name: string;
  readonly description: string;
  readonly parameters: LlmToolDeclaration["parameters"];
  execute(
    ctx: AiToolContext,
    args?: Record<string, unknown>,
  ): Promise<AiToolResult>;
}

export function toToolDeclaration(tool: AiTool): LlmToolDeclaration {
  return {
    type: "function",
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
  };
}
