import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import { DashboardDto } from "src/core/dto/finance.dto";
import { Account } from "src/db/dbModels/Account";
import { Category } from "src/db/dbModels/Category";
import { Transaction } from "src/db/dbModels/Transaction";
import { AccountsService } from "./accounts.service";
import { CategoriesService } from "./categories.service";
import { toMoney } from "./finance.utils";

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
    await this.categoriesService.ensureDefaults(userId);

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

    const balance = accounts.reduce(
      (sum, account) => sum + toMoney(account.balance),
      0,
    );
    const savings = accounts
      .filter((account) => account.type === "jar")
      .reduce((sum, account) => sum + toMoney(account.balance), 0);

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

    let income = 0;
    let expenses = 0;
    const dailyMap = new Map<string, { income: number; expense: number }>();
    const categoryMap = new Map<
      string,
      { categoryId: string | null; name: string; type: string; total: number }
    >();

    for (const tx of transactions) {
      const amount = toMoney(tx.amount);
      const day = tx.occurredAt.toISOString().slice(0, 10);
      const daily = dailyMap.get(day) ?? { income: 0, expense: 0 };

      if (tx.type === "income") {
        income += amount;
        daily.income += amount;
      } else {
        expenses += amount;
        daily.expense += amount;
      }
      dailyMap.set(day, daily);

      const key = `${tx.type}:${tx.categoryId ?? "none"}`;
      const current = categoryMap.get(key) ?? {
        categoryId: tx.categoryId,
        name: tx.category?.name ?? (tx.type === "income" ? "Income" : "Other"),
        type: tx.type,
        total: 0,
      };
      current.total = toMoney(current.total + amount);
      categoryMap.set(key, current);
    }

    return {
      balance: toMoney(balance),
      income: toMoney(income),
      expenses: toMoney(expenses),
      savings: toMoney(savings),
      net: toMoney(income - expenses),
      currency: "UAH",
      period: {
        from: periodFrom.toISOString(),
        to: periodTo.toISOString(),
      },
      accounts: accounts.map((account) => this.accountsService.toDto(account)),
      dailySeries: Array.from(dailyMap.entries()).map(([date, value]) => ({
        date,
        income: toMoney(value.income),
        expense: toMoney(value.expense),
      })),
      byCategory: Array.from(categoryMap.values()).sort(
        (a, b) => b.total - a.total,
      ),
    };
  }
}
