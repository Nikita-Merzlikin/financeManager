import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { GeminiProvider } from "src/ai/providers/gemini.provider";
import { LLM_PROVIDER } from "src/core/constants/ai.constants";
import { Account } from "src/db/dbModels/Account";
import { Category } from "src/db/dbModels/Category";
import { FinancialPlan } from "src/db/dbModels/FinancialPlan";
import { FinancialPlanCategory } from "src/db/dbModels/FinancialPlanCategory";
import { FinancialPlanDay } from "src/db/dbModels/FinancialPlanDay";
import { Transaction } from "src/db/dbModels/Transaction";
import { FinancialPlanAiService } from "./financial-plan-ai.service";
import { FinancialPlanController } from "./financial-plan.controller";
import { FinancialPlanService } from "./financial-plan.service";

@Module({
  imports: [
    SequelizeModule.forFeature([
      FinancialPlan,
      FinancialPlanCategory,
      FinancialPlanDay,
      Transaction,
      Category,
      Account,
    ]),
  ],
  controllers: [FinancialPlanController],
  providers: [
    FinancialPlanService,
    FinancialPlanAiService,
    GeminiProvider,
    {
      provide: LLM_PROVIDER,
      useExisting: GeminiProvider,
    },
  ],
  exports: [FinancialPlanService],
})
export class FinancialPlanModule {}
