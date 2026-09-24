import { Module, forwardRef } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { Account } from "src/db/dbModels/Account";
import { BankConnection } from "src/db/dbModels/BankConnection";
import { Category } from "src/db/dbModels/Category";
import { Transaction } from "src/db/dbModels/Transaction";
import { FinancialPlanModule } from "src/financial-plan/financial-plan.module";
import { AccountsService } from "./accounts.service";
import { BankFactory } from "./banks/bank.factory";
import { MonobankBank } from "./banks/monobank.bank";
import { MonobankClient } from "./banks/monobank.client";
import { PrivatBank } from "./banks/privat.bank";
import { PrivatClient } from "./banks/privat.client";
import { BanksService } from "./banks.service";
import { CategoriesService } from "./categories.service";
import { DashboardService } from "./dashboard.service";
import { FinanceController } from "./finance.controller";
import { TransactionsService } from "./transactions.service";
import { WebhooksController } from "./webhooks.controller";

@Module({
  imports: [
    SequelizeModule.forFeature([
      Account,
      Transaction,
      Category,
      BankConnection,
    ]),
    forwardRef(() => FinancialPlanModule),
  ],
  controllers: [FinanceController, WebhooksController],
  providers: [
    AccountsService,
    TransactionsService,
    CategoriesService,
    DashboardService,
    BanksService,
    BankFactory,
    MonobankBank,
    MonobankClient,
    PrivatBank,
    PrivatClient,
  ],
  exports: [
    DashboardService,
    AccountsService,
    TransactionsService,
    CategoriesService,
  ],
})
export class FinanceModule {}
