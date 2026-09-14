import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from "@nestjs/common";
import { AI_ERROR_MESSAGES } from "src/core/constants/ai-errors.constants";
import { LLM_PROVIDER } from "src/core/constants/ai.constants";
import { AiChatRequestDto, AiChatResponseDto } from "src/core/dto/ai.dto";
import type { LlmFunctionResult, LlmProvider } from "src/core/types/ai.types";
import { getAiConfig } from "./ai.config";
import { FINANCIAL_AGENT_SYSTEM_PROMPT } from "./prompts/financial-agent.prompt";
import { AiToolRegistry } from "./tools/ai-tool.registry";

@Injectable()
export class AgentOrchestrator {
  private readonly logger = new Logger(AgentOrchestrator.name);

  constructor(
    @Inject(LLM_PROVIDER) private readonly llm: LlmProvider,
    private readonly toolRegistry: AiToolRegistry,
  ) {}

  async chat(
    userId: string,
    dto: AiChatRequestDto,
  ): Promise<AiChatResponseDto> {
    const config = getAiConfig();
    const message = dto.message.trim();
    if (!message) {
      throw new BadRequestException(AI_ERROR_MESSAGES.MESSAGE_REQUIRED);
    }
    if (message.length > config.maxInputLength) {
      throw new BadRequestException(AI_ERROR_MESSAGES.MESSAGE_TOO_LONG);
    }

    const tools = this.toolRegistry.getDeclarations();
    const toolsUsed: string[] = [];
    let interactionId = dto.conversationId;
    let functionResults: LlmFunctionResult[] | undefined;
    let pendingUserMessage: string | undefined = message;

    for (
      let iteration = 0;
      iteration <= config.maxToolIterations;
      iteration++
    ) {
      const response = await this.llm.generate({
        model: config.model,
        systemInstruction: FINANCIAL_AGENT_SYSTEM_PROMPT,
        userMessage: pendingUserMessage,
        tools,
        previousInteractionId: interactionId,
        functionResults,
        timeoutMs: config.timeoutMs,
      });

      interactionId = response.interactionId;
      pendingUserMessage = undefined;
      functionResults = undefined;

      if (response.functionCalls.length === 0) {
        return {
          reply:
            response.text ??
            "I could not produce a response. Please try again.",
          conversationId: interactionId,
          toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        };
      }

      if (iteration === config.maxToolIterations) {
        throw new BadRequestException(AI_ERROR_MESSAGES.MAX_TOOL_ITERATIONS);
      }

      const results: LlmFunctionResult[] = [];
      for (const call of response.functionCalls) {
        toolsUsed.push(call.name);
        this.logger.debug(`Executing tool ${call.name} for user ${userId}`);

        const result = await this.toolRegistry.execute(
          call.name,
          { userId },
          call.arguments,
        );
        results.push({
          name: call.name,
          callId: call.id,
          result,
        });
      }
      functionResults = results;
    }

    throw new BadRequestException(AI_ERROR_MESSAGES.MAX_TOOL_ITERATIONS);
  }
}
