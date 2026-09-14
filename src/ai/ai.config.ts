import {
  AI_DEFAULT_MAX_INPUT_LENGTH,
  AI_DEFAULT_MAX_TOOL_ITERATIONS,
  AI_DEFAULT_MODEL,
  AI_DEFAULT_TIMEOUT_MS,
} from "src/core/constants/ai.constants";

export function getAiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: process.env.GEMINI_MODEL ?? AI_DEFAULT_MODEL,
    maxToolIterations: Number(
      process.env.AI_MAX_TOOL_ITERATIONS ?? AI_DEFAULT_MAX_TOOL_ITERATIONS,
    ),
    timeoutMs: Number(process.env.AI_TIMEOUT_MS ?? AI_DEFAULT_TIMEOUT_MS),
    maxInputLength: Number(
      process.env.AI_MAX_INPUT_LENGTH ?? AI_DEFAULT_MAX_INPUT_LENGTH,
    ),
  };
}

export type AiConfig = ReturnType<typeof getAiConfig>;
