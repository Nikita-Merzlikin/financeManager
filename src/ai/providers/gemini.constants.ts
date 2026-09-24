/** Gemini Interactions API SSE / step type literals (avoid magic strings). */
export const GEMINI_SSE_EVENT = {
  STEP_DELTA: "step.delta",
  STEP_START: "step.start",
  INTERACTION_COMPLETED: "interaction.completed",
  INTERACTION_CREATED: "interaction.created",
} as const;

export const GEMINI_STEP_TYPE = {
  FUNCTION_CALL: "function_call",
} as const;

export const GEMINI_DELTA_TYPE = {
  TEXT: "text",
} as const;

export const GEMINI_INPUT_TYPE = {
  FUNCTION_RESULT: "function_result",
  TEXT: "text",
} as const;

/** Substrings used to classify raw Gemini/SDK error messages. */
export const GEMINI_ERROR_MARKERS = {
  TIMEOUT: "timeout",
  RATE: "rate",
  RATE_LIMIT_STATUS: "429",
  QUOTA: "quota",
  RESOURCE_EXHAUSTED: "resource_exhausted",
  API_KEY: "api key",
  API_KEY_SNAKE: "api_key",
} as const;
