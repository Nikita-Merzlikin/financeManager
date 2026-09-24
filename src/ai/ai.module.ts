import { Module, forwardRef } from "@nestjs/common";
import { FinanceModule } from "src/finance/finance.module";
import { FinancialPlanModule } from "src/financial-plan/financial-plan.module";
import { LLM_PROVIDER } from "src/core/constants/ai.constants";
import { AiErrorInterceptor } from "./ai-error.interceptor";
import { AgentOrchestrator } from "./agent.orchestrator";
import { AiController } from "./ai.controller";
import { GeminiProvider } from "./providers/gemini.provider";
import { AiToolRegistry } from "./tools/ai-tool.registry";
import { CreateTransactionTool } from "./tools/create-transaction.tool";
import { GetBalanceTool } from "./tools/get-balance.tool";
import { GetCategoriesTool } from "./tools/get-categories.tool";
import { GetDashboardTool } from "./tools/get-dashboard.tool";
import { GetTransactionsTool } from "./tools/get-transactions.tool";
import { GetFinancialPlanTool } from "./tools/get-financial-plan.tool";
import { GetPlanForecastTool } from "./tools/get-plan-forecast.tool";
import { AnalyzeFinancialPlanTool } from "./tools/analyze-financial-plan.tool";

/** Finance AI agent: chat endpoint + Gemini provider + whitelist tools. */
@Module({
  imports: [FinanceModule, forwardRef(() => FinancialPlanModule)],
  controllers: [AiController],
  providers: [
    AiErrorInterceptor,
    AgentOrchestrator,
    AiToolRegistry,
    GetBalanceTool,
    GetCategoriesTool,
    GetTransactionsTool,
    GetDashboardTool,
    CreateTransactionTool,
    GetFinancialPlanTool,
    GetPlanForecastTool,
    AnalyzeFinancialPlanTool,
    GeminiProvider,
    {
      provide: LLM_PROVIDER,
      useExisting: GeminiProvider,
    },
  ],
  exports: [LLM_PROVIDER, GeminiProvider],
})
export class AiModule {}
