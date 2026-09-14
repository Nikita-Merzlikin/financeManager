export const AI_ERROR_MESSAGES = {
  MESSAGE_REQUIRED: "Message is required",
  MESSAGE_TOO_LONG: "Message exceeds maximum allowed length",
  GEMINI_API_KEY_MISSING: "Gemini API key is not configured",
  GEMINI_UNAVAILABLE: "AI service is temporarily unavailable",
  GEMINI_RATE_LIMIT: "AI rate limit exceeded. Please try again later",
  GEMINI_QUOTA: "AI quota exhausted. Please try again later",
  INVALID_TOOL: "Requested AI tool is not allowed",
  INVALID_TOOL_ARGUMENTS: "Invalid tool arguments",
  TOOL_EXECUTION_FAILED: "Tool execution failed",
  MAX_TOOL_ITERATIONS: "AI stopped after reaching the maximum tool iterations",
  TIMEOUT: "AI request timed out",
  MALFORMED_RESPONSE: "AI returned a malformed response",
} as const;
