import { Module } from "@nestjs/common";
import { FinanceModule } from "src/finance/finance.module";
import { LLM_PROVIDER } from "src/core/constants/ai.constants";
import { AgentOrchestrator } from "./agent.orchestrator";
import { AiController } from "./ai.controller";
import { GeminiProvider } from "./providers/gemini.provider";
import { AiToolRegistry } from "./tools/ai-tool.registry";
import { CreateTransactionTool } from "./tools/create-transaction.tool";
import { GetBalanceTool } from "./tools/get-balance.tool";
import { GetCategoriesTool } from "./tools/get-categories.tool";
import { GetDashboardTool } from "./tools/get-dashboard.tool";
import { GetTransactionsTool } from "./tools/get-transactions.tool";

/** Finance AI agent: chat endpoint + Gemini provider + whitelist tools. */
@Module({
  imports: [FinanceModule],
  controllers: [AiController],
  providers: [
    AgentOrchestrator,
    AiToolRegistry,
    GetBalanceTool,
    GetCategoriesTool,
    GetTransactionsTool,
    GetDashboardTool,
    CreateTransactionTool,
    GeminiProvider,
    // Swap provider here without changing the orchestrator.
    {
      provide: LLM_PROVIDER,
      useExisting: GeminiProvider,
    },
  ],
})
export class AiModule {}
