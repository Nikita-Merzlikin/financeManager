import {
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import { GeminiApiError } from "./gemini-api.error";

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

  if (message.includes("timeout")) {
    return new ServiceUnavailableException(AI_ERROR_MESSAGES.TIMEOUT);
  }
  if (message.includes("429") || message.includes("rate")) {
    return new HttpException(
      AI_ERROR_MESSAGES.GEMINI_RATE_LIMIT,
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
  if (message.includes("quota") || message.includes("resource_exhausted")) {
    return new ServiceUnavailableException(AI_ERROR_MESSAGES.GEMINI_QUOTA);
  }
  if (message.includes("api key") || message.includes("api_key")) {
    return new ServiceUnavailableException(
      AI_ERROR_MESSAGES.GEMINI_API_KEY_MISSING,
    );
  }

  return new ServiceUnavailableException(AI_ERROR_MESSAGES.GEMINI_UNAVAILABLE);
}
