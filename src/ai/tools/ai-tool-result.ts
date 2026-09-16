import type { AiToolResult } from "src/core/types/ai.types";

/** Wrap a successful tool payload as `{ ok: true, data }`. */
export function okResult<T>(data: T): AiToolResult & { ok: true; data: T } {
  return { ok: true, data };
}

/** Wrap a tool failure as `{ ok: false, error }`. */
export function errorResult(
  error: string,
): AiToolResult & { ok: false; error: string } {
  return { ok: false, error };
}
