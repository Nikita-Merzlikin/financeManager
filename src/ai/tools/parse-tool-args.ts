import { BadRequestException } from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";

/** Map raw LLM tool args onto a DTO class and run class-validator. */
export async function parseToolArgs<T extends object>(
  DtoClass: new () => T,
  args: Record<string, unknown>,
): Promise<T> {
  const dto = plainToInstance(DtoClass, args, {
    enableImplicitConversion: true,
    exposeDefaultValues: true,
  });

  const errors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    const details = errors
      .flatMap((error) => Object.values(error.constraints ?? {}))
      .join("; ");
    throw new BadRequestException(
      details || AI_ERROR_MESSAGES.INVALID_TOOL_ARGUMENTS,
    );
  }

  return dto;
}
