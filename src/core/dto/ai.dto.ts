import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { AI_DEFAULT_MAX_INPUT_LENGTH } from "../constants/ai.constants";

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
