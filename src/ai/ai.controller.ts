import { Body, Controller, Post, Res, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProduces,
  ApiTags,
} from "@nestjs/swagger";
import type { Response } from "express";
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

  @Post("chat/stream")
  @ApiBody({ type: AiChatRequestDto })
  @ApiProduces("text/event-stream")
  @ApiOperation({
    summary: "Stream chat with the finance AI agent (SSE)",
    description:
      "Same agent as POST /ai/chat, but emits Server-Sent Events so the client can show " +
      "status, tool progress, and text deltas as they arrive. Final event type is `done` or `error`.",
  })
  async chatStream(
    @CurrentUser() user: JwtPayload,
    @Body() dto: AiChatRequestDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders?.();

    try {
      for await (const event of this.agentOrchestrator.chatStream(
        user.sub,
        dto,
      )) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
        if (event.type === "done" || event.type === "error") {
          break;
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Stream failed";
      res.write(`data: ${JSON.stringify({ type: "error", message })}\n\n`);
    } finally {
      res.end();
    }
  }
}
