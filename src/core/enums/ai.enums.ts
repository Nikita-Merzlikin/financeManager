/** SSE event types for POST /ai/chat/stream. */
export enum AiChatStreamEventType {
  STATUS = "status",
  TOOL_START = "tool_start",
  TOOL_RESULT = "tool_result",
  TEXT_DELTA = "text_delta",
  DONE = "done",
  ERROR = "error",
}

/** Chunk types from the LLM provider stream. */
export enum LlmStreamChunkType {
  TEXT_DELTA = "text_delta",
  FINAL = "final",
}
