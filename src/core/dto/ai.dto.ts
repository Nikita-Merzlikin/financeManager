import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { AI_DEFAULT_MAX_INPUT_LENGTH } from "../constants/ai.constants";
import {
  CurrencyEnum,
  DEFAULT_CURRENCY,
  TransactionType,
} from "../enums/finance.enums";

export class AiChatRequestDto {
  @ApiProperty({
    example: "How much did I spend on food this month?",
    description: "Natural-language question or command about personal finances",
  })
  @IsString()
  @MinLength(1)
  @MaxLength(AI_DEFAULT_MAX_INPUT_LENGTH)
  message!: string;

  @ApiPropertyOptional({
    description:
      "Optional previous Gemini interaction id for multi-turn conversations",
  })
  @IsOptional()
  @IsString()
  conversationId?: string;
}

export class AiChatResponseDto {
  @ApiProperty({ example: "You spent 1250.50 UAH on Food this month." })
  reply!: string;

  @ApiPropertyOptional({
    description: "Gemini interaction id for continuing the conversation",
  })
  conversationId?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ["get_categories", "get_dashboard"],
  })
  toolsUsed?: string[];
}

/** Args for get_dashboard / period tools. */
export class AiPeriodArgsDto {
  @ApiPropertyOptional({
    example: "2026-09-01T00:00:00.000Z",
    description: "Period start (ISO-8601)",
  })
  @IsOptional()
  @IsISO8601()
  from?: string;

  @ApiPropertyOptional({
    example: "2026-09-16T23:59:59.000Z",
    description: "Period end (ISO-8601)",
  })
  @IsOptional()
  @IsISO8601()
  to?: string;
}

/** Args for get_transactions tool. */
export class AiGetTransactionsArgsDto extends AiPeriodArgsDto {
  @ApiPropertyOptional({ description: "Category UUID filter" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}

/** Args for create_transaction tool (validated before domain create). */
export class AiCreateTransactionArgsDto {
  @ApiProperty()
  @IsUUID()
  accountId!: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  type!: TransactionType;

  @ApiProperty({ example: 250.5 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: DEFAULT_CURRENCY, enum: CurrencyEnum })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ example: "Grocery" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: "2026-08-21T12:00:00.000Z" })
  @IsOptional()
  @IsISO8601()
  occurredAt?: string;
}
