/**
 * Raw Gemini/SDK failure before HTTP mapping.
 * Mapped to Nest HttpExceptions by AiErrorInterceptor / mapGeminiError().
 */
export class GeminiApiError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "GeminiApiError";
  }
}
