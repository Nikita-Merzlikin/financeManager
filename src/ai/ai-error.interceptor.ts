import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";
import { Observable, throwError } from "rxjs";
import { catchError } from "rxjs/operators";
import { GeminiApiError } from "./providers/gemini-api.error";
import { mapGeminiError } from "./providers/gemini-error.mapper";

/**
 * Converts Gemini/provider failures into proper Nest HTTP exceptions
 * (503 / 429) for non-stream chat responses.
 */
@Injectable()
export class AiErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AiErrorInterceptor.name);

  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((error: unknown) => {
        if (error instanceof GeminiApiError) {
          this.logger.error(`Gemini API error: ${error.message}`);
        }
        return throwError(() => mapGeminiError(error));
      }),
    );
  }
}
