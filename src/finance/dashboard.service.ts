import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { DashboardDto } from "src/core/dto/finance.dto";
import {
  AccountType,
  DEFAULT_CURRENCY,
  TransactionType,
} from "src/core/enums/finance.enums";
import { Account } from "src/db/dbModels/Account";
import { Category } from "src/db/dbModels/Category";
import { Transaction } from "src/db/dbModels/Transaction";
import { AccountsService } from "./accounts.service";
import { CategoriesService } from "./categories.service";
import {
  addMinor,
  fromMinorUnits,
  parseMinorUnits,
  subMinor,
} from "./finance.utils";

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Account)
    private readonly accountModel: typeof Account,
    @InjectModel(Transaction)
    private readonly transactionModel: typeof Transaction,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    private readonly accountsService: AccountsService,
    private readonly categoriesService: CategoriesService,
  ) {}

  async getDashboard(
    userId: string,
    from?: string,
    to?: string,
  ): Promise<DashboardDto> {
    await this.categoriesService.ensureDefaults();

    const periodTo = to ? new Date(to) : new Date();
    const periodFrom = from
      ? new Date(from)
      : new Date(
          periodTo.getFullYear(),
          periodTo.getMonth(),
          periodTo.getDate() - 29,
        );

    const accounts = await this.accountModel.findAll({
      where: { userId, isActive: true },
    });

    const balanceMinor = accounts.reduce(
      (sum, account) => addMinor(sum, account.balance),
      0n,
    );
    const savingsMinor = accounts
      .filter((account) => account.type === AccountType.JAR)
      .reduce((sum, account) => addMinor(sum, account.balance), 0n);

    const transactions = await this.transactionModel.findAll({
      where: {
        userId,
        occurredAt: {
          [Op.gte]: periodFrom,
          [Op.lte]: periodTo,
        },
      },
      include: [Category],
      order: [["occurredAt", "ASC"]],
    });

    let incomeMinor = 0n;
    let expensesMinor = 0n;
    const dailyMap = new Map<string, { income: bigint; expense: bigint }>();
    const categoryMap = new Map<
      string,
      { categoryId: string | null; name: string; type: string; total: bigint }
    >();

    for (const tx of transactions) {
      const amount = parseMinorUnits(tx.amount);
      const day = tx.occurredAt.toISOString().slice(0, 10);
      const daily = dailyMap.get(day) ?? { income: 0n, expense: 0n };

      if (tx.type === TransactionType.INCOME) {
        incomeMinor = addMinor(incomeMinor, amount);
        daily.income = addMinor(daily.income, amount);
      } else {
        expensesMinor = addMinor(expensesMinor, amount);
        daily.expense = addMinor(daily.expense, amount);
      }
      dailyMap.set(day, daily);

      const key = `${tx.type}:${tx.categoryId ?? "none"}`;
      const current = categoryMap.get(key) ?? {
        categoryId: tx.categoryId,
        name:
          tx.category?.name ??
          (tx.type === TransactionType.INCOME ? "Income" : "Other"),
        type: tx.type,
        total: 0n,
      };
      current.total = addMinor(current.total, amount);
      categoryMap.set(key, current);
    }

    const netMinor = subMinor(incomeMinor, expensesMinor);

    return {
      balance: fromMinorUnits(balanceMinor),
      income: fromMinorUnits(incomeMinor),
      expenses: fromMinorUnits(expensesMinor),
      savings: fromMinorUnits(savingsMinor),
      net: fromMinorUnits(netMinor),
      currency: DEFAULT_CURRENCY,
      period: {
        from: periodFrom.toISOString(),
        to: periodTo.toISOString(),
      },
      accounts: accounts.map((account) => this.accountsService.toDto(account)),
      dailySeries: Array.from(dailyMap.entries()).map(([date, value]) => ({
        date,
        income: fromMinorUnits(value.income),
        expense: fromMinorUnits(value.expense),
      })),
      byCategory: Array.from(categoryMap.values())
        .map((item) => ({
          categoryId: item.categoryId,
          name: item.name,
          type: item.type,
          total: fromMinorUnits(item.total),
        }))
        .sort((a, b) => b.total - a.total),
    };
  }
}
