import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { CurrentUser } from "src/auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ApiCommonHeaders } from "src/core/decorators/api-common-headers.decorator";
import { AiChatRequestDto, AiChatResponseDto } from "src/core/dto/ai.dto";
import type { JwtPayload } from "src/core/types/jwt-payload.type";
import { AgentOrchestrator } from "./agent.orchestrator";

/** Thin HTTP layer for the finance AI agent. */
@ApiTags("ai")
@ApiCommonHeaders()
@ApiBearerAuth("access-token")
@UseGuards(JwtAuthGuard)
@Controller("ai")
export class AiController {
  constructor(private readonly agentOrchestrator: AgentOrchestrator) {}

  @Post("chat")
  @ApiBody({ type: AiChatRequestDto })
  @ApiOkResponse({ type: AiChatResponseDto })
  @ApiOperation({
    summary: "Chat with the finance AI agent",
    description:
      "Natural-language interface over your accounts, categories, transactions, and dashboard. " +
      "The agent may call read/write finance tools on your behalf. userId is always taken from the JWT.",
  })
  chat(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AiChatRequestDto,
  ): Promise<AiChatResponseDto> {
    // Never trust model-supplied user identity — always use JWT sub.
    return this.agentOrchestrator.chat(user.sub, dto);
  }
}
