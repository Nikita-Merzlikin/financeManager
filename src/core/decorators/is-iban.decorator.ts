import { applyDecorators } from "@nestjs/common";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIBAN, IsOptional, IsString } from "class-validator";

type IsIbanOptions = {
  required?: boolean;
  example?: string;
  description?: string;
};

export function IsIbanField(options: IsIbanOptions = {}) {
  const {
    required = true,
    example = "UA903052990004149123456789012",
    description = "Valid IBAN",
  } = options;

  if (required) {
    return applyDecorators(
      ApiProperty({ example, description }),
      IsString(),
      IsIBAN(),
    );
  }

  return applyDecorators(
    ApiPropertyOptional({ example, description }),
    IsOptional(),
    IsString(),
    IsIBAN(),
  );
}
