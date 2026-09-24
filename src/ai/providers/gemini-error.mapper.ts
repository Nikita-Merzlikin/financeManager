import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import { GeminiApiError } from "./gemini-api.error";
import { GEMINI_ERROR_MARKERS } from "./gemini.constants";

/**
 * Maps Gemini / network failures to Nest HTTP exceptions.
 * Uses 503/429 — never BadRequest (that is for invalid user input).
 */
export function mapGeminiError(error: unknown): HttpException {
  if (error instanceof HttpException) {
    return error;
  }

  const raw =
    error instanceof GeminiApiError
      ? error.message
      : error instanceof Error
        ? error.message
        : String(error);
  const message = raw.toLowerCase();

  if (message.includes(GEMINI_ERROR_MARKERS.TIMEOUT)) {
    return new ServiceUnavailableException(AI_ERROR_MESSAGES.TIMEOUT);
  }
  if (
    message.includes(GEMINI_ERROR_MARKERS.RATE_LIMIT_STATUS) ||
    message.includes(GEMINI_ERROR_MARKERS.RATE)
  ) {
    return new HttpException(
      AI_ERROR_MESSAGES.GEMINI_RATE_LIMIT,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
  if (
    message.includes(GEMINI_ERROR_MARKERS.QUOTA) ||
    message.includes(GEMINI_ERROR_MARKERS.RESOURCE_EXHAUSTED)
  ) {
    return new ServiceUnavailableException(AI_ERROR_MESSAGES.GEMINI_QUOTA);
  }
  if (
    message.includes(GEMINI_ERROR_MARKERS.API_KEY) ||
    message.includes(GEMINI_ERROR_MARKERS.API_KEY_SNAKE)
  ) {
    return new ServiceUnavailableException(
      AI_ERROR_MESSAGES.GEMINI_API_KEY_MISSING,
    );
  }

  return new ServiceUnavailableException(AI_ERROR_MESSAGES.GEMINI_UNAVAILABLE);
}
