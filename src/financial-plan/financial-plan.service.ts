import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Op } from "sequelize";
import {
  FINANCIAL_PLAN_BASELINE_LOOKBACK_DAYS,
  FINANCIAL_PLAN_MAX_CATEGORIES,
  FINANCIAL_PLAN_MIN_HISTORY_DAYS,
  MS_PER_DAY,
} from "src/core/constants/financial-plan.constants";
import { FINANCIAL_PLAN_ERROR_MESSAGES } from "src/core/constants/financial-plan-errors.constants";
import {
  CreateFinancialPlanDto,
  FinancialPlanBaselineDto,
  FinancialPlanCategoryResponseDto,
  FinancialPlanDayResponseDto,
  FinancialPlanForecastDto,
  FinancialPlanPeriodResponseDto,
  FinancialPlanResponseDto,
  UpdateFinancialPlanDto,
} from "src/core/dto/financial-plan.dto";
import {
  AccountType,
  DEFAULT_CURRENCY,
  TransactionType,
} from "src/core/enums/finance.enums";
import {
  FinancialPlanStatus,
} from "src/core/enums/financial-plan.enums";
import { Account } from "src/db/dbModels/Account";
import { Category } from "src/db/dbModels/Category";
import { FinancialPlan } from "src/db/dbModels/FinancialPlan";
import { FinancialPlanCategory } from "src/db/dbModels/FinancialPlanCategory";
import { FinancialPlanDay } from "src/db/dbModels/FinancialPlanDay";
import { Transaction } from "src/db/dbModels/Transaction";
import {
  formatMinorUnits,
  fromMinorUnits,
  parseMinorUnits,
  toMinorUnits,
} from "src/finance/finance.utils";
import { calculateBaselineSavings } from "./calculators/baseline-savings.calculator";
import {
  aggregatePeriod,
  redistributeBudget,
} from "./calculators/budget-redistribution.calculator";
import { calculateForecast } from "./calculators/forecast.calculator";
import {
  calculateBudgetBreakdown,
  calculateCategoryVariance,
  calculatePlanProgress,
  eachDateInclusive,
  parseDateKey,
  toDateKey,
} from "./calculators/financial-plan.calculator";
import {
  groupDaysByFrequency,
  toFinancialPlanCategoryResponse,
  toFinancialPlanDayResponse,
} from "./financial-plan.presenter";

@Injectable()
export class FinancialPlanService {
  constructor(
    @InjectModel(FinancialPlan)
    private readonly planModel: typeof FinancialPlan,
    @InjectModel(FinancialPlanCategory)
    private readonly planCategoryModel: typeof FinancialPlanCategory,
    @InjectModel(FinancialPlanDay)
    private readonly planDayModel: typeof FinancialPlanDay,
    @InjectModel(Transaction)
    private readonly transactionModel: typeof Transaction,
    @InjectModel(Category)
    private readonly categoryModel: typeof Category,
    @InjectModel(Account)
    private readonly accountModel: typeof Account,
  ) {}

  async create(
    userId: string,
    dto: CreateFinancialPlanDto,
  ): Promise<FinancialPlanResponseDto> {
    const existing = await this.planModel.findOne({
      where: { userId, status: FinancialPlanStatus.ACTIVE },
    });
    if (existing) {
      throw new ConflictException(
        FINANCIAL_PLAN_ERROR_MESSAGES.PLAN_ALREADY_ACTIVE,
      );
    }

    const asOf = new Date();
    const targetDate = new Date(dto.targetDate);
    if (targetDate <= asOf) {
      throw new BadRequestException(
        FINANCIAL_PLAN_ERROR_MESSAGES.INVALID_TARGET_DATE,
      );
    }

    const categoryLimits = dto.categoryLimits ?? [];
    if (categoryLimits.length > FINANCIAL_PLAN_MAX_CATEGORIES) {
      throw new BadRequestException(
        FINANCIAL_PLAN_ERROR_MESSAGES.TOO_MANY_CATEGORIES,
      );
    }
    await this.assertCategories(
      userId,
      categoryLimits.map((c) => c.categoryId),
    );

    const incomeMinor = toMinorUnits(dto.income);
    const mandatoryMinor = toMinorUnits(dto.mandatoryExpenses);
    const savingsMinor = toMinorUnits(dto.desiredSavings);
    const targetMinor = toMinorUnits(dto.targetAmount);
    const categoryLimitsSum = categoryLimits.reduce(
      (sum, c) => sum + toMinorUnits(c.limit),
      0n,
    );

    const breakdown = calculateBudgetBreakdown({
      incomeMinor,
      mandatoryExpensesMinor: mandatoryMinor,
      desiredSavingsMinor: savingsMinor,
      targetAmountMinor: targetMinor,
      accumulatedTowardGoalMinor: 0n,
      targetDate,
      asOf,
      categoryLimitsMinor: categoryLimitsSum,
    });

    if (
      incomeMinor <
      savingsMinor + breakdown.goalContributionMonthlyMinor + mandatoryMinor
    ) {
      throw new BadRequestException(
        FINANCIAL_PLAN_ERROR_MESSAGES.INVALID_BUDGET,
      );
    }

    const startDate = toDateKey(asOf);
    const plan = await this.planModel.create({
      userId,
      status: FinancialPlanStatus.ACTIVE,
      income: formatMinorUnits(incomeMinor),
      averageExpenses: formatMinorUnits(toMinorUnits(dto.averageExpenses)),
      mandatoryExpenses: formatMinorUnits(mandatoryMinor),
      desiredSavings: formatMinorUnits(savingsMinor),
      goal: dto.goal,
      targetAmount: formatMinorUnits(targetMinor),
      targetDate: toDateKey(targetDate),
      frequency: dto.frequency,
      currency: dto.currency ?? DEFAULT_CURRENCY,
      startDate,
    });

    if (categoryLimits.length > 0) {
      await this.planCategoryModel.bulkCreate(
        categoryLimits.map((c) => ({
          financialPlanId: plan.id,
          categoryId: c.categoryId,
          limitAmount: formatMinorUnits(toMinorUnits(c.limit)),
          isMandatory: c.isMandatory ?? false,
        })),
      );
    }

    await this.seedPlanDays(
      plan.id,
      startDate,
      toDateKey(targetDate),
      breakdown.dailySpendingBudgetMinor,
    );

    return this.getActive(userId);
  }

  async getActive(userId: string): Promise<FinancialPlanResponseDto> {
    const plan = await this.findActivePlan(userId);
    await this.recalculateInternal(plan);
    return this.buildPlanResponse(plan);
  }

  async update(
    userId: string,
    dto: UpdateFinancialPlanDto,
  ): Promise<FinancialPlanResponseDto> {
    const plan = await this.findActivePlan(userId);
    const asOf = new Date();
    const today = toDateKey(asOf);

    // Freeze historical days before applying new parameters.
    await this.planDayModel.update(
      { locked: true },
      {
        where: {
          financialPlanId: plan.id,
          date: { [Op.lt]: today },
          locked: false,
        },
      },
    );

    if (dto.targetDate) {
      const targetDate = new Date(dto.targetDate);
      if (targetDate <= asOf) {
        throw new BadRequestException(
          FINANCIAL_PLAN_ERROR_MESSAGES.INVALID_TARGET_DATE,
        );
      }
    }

    if (dto.categoryLimits) {
      if (dto.categoryLimits.length > FINANCIAL_PLAN_MAX_CATEGORIES) {
        throw new BadRequestException(
          FINANCIAL_PLAN_ERROR_MESSAGES.TOO_MANY_CATEGORIES,
        );
      }
      await this.assertCategories(
        userId,
        dto.categoryLimits.map((c) => c.categoryId),
      );
      await this.planCategoryModel.destroy({
        where: { financialPlanId: plan.id },
      });
      if (dto.categoryLimits.length > 0) {
        await this.planCategoryModel.bulkCreate(
          dto.categoryLimits.map((c) => ({
            financialPlanId: plan.id,
            categoryId: c.categoryId,
            limitAmount: formatMinorUnits(toMinorUnits(c.limit)),
            isMandatory: c.isMandatory ?? false,
          })),
        );
      }
    }

    await plan.update({
      ...(dto.income !== undefined && {
        income: formatMinorUnits(toMinorUnits(dto.income)),
      }),
      ...(dto.averageExpenses !== undefined && {
        averageExpenses: formatMinorUnits(toMinorUnits(dto.averageExpenses)),
      }),
      ...(dto.mandatoryExpenses !== undefined && {
        mandatoryExpenses: formatMinorUnits(
          toMinorUnits(dto.mandatoryExpenses),
        ),
      }),
      ...(dto.desiredSavings !== undefined && {
        desiredSavings: formatMinorUnits(toMinorUnits(dto.desiredSavings)),
      }),
      ...(dto.goal !== undefined && { goal: dto.goal }),
      ...(dto.targetAmount !== undefined && {
        targetAmount: formatMinorUnits(toMinorUnits(dto.targetAmount)),
      }),
      ...(dto.targetDate !== undefined && {
        targetDate: toDateKey(new Date(dto.targetDate)),
      }),
      ...(dto.frequency !== undefined && { frequency: dto.frequency }),
    });

    await plan.reload();
    await this.rebuildFutureDays(plan, today);
    return this.buildPlanResponse(plan);
  }

  async recalculate(userId: string): Promise<FinancialPlanResponseDto> {
    const plan = await this.findActivePlan(userId);
    await this.recalculateInternal(plan);
    return this.buildPlanResponse(plan);
  }

  /**
   * Called after transaction mutations so the active plan stays current.
   * No-op when the user has no active plan.
   */
  async recalculateForUser(userId: string): Promise<void> {
    const plan = await this.planModel.findOne({
      where: { userId, status: FinancialPlanStatus.ACTIVE },
    });
    if (!plan) return;
    await this.recalculateInternal(plan);
  }

  async getCalendar(userId: string): Promise<FinancialPlanDayResponseDto[]> {
    const plan = await this.findActivePlan(userId);
    const days = await this.loadRedistributedDays(plan);
    return days.map((day) => toFinancialPlanDayResponse(day));
  }

  async getPeriods(userId: string): Promise<FinancialPlanPeriodResponseDto[]> {
    const plan = await this.findActivePlan(userId);
    const days = await this.loadRedistributedDays(plan);
    return groupDaysByFrequency(days, plan.frequency, plan.startDate);
  }

  async getCategories(
    userId: string,
  ): Promise<FinancialPlanCategoryResponseDto[]> {
    const plan = await this.findActivePlan(userId);
    return this.buildCategoryDtos(plan);
  }

  async getForecast(userId: string): Promise<FinancialPlanForecastDto> {
    const plan = await this.findActivePlan(userId);
    const days = await this.loadRedistributedDays(plan);
    const today = toDateKey(new Date());
    const elapsed = days.filter((d) => d.date <= today);
    const hasEnoughHistory = elapsed.length >= FINANCIAL_PLAN_MIN_HISTORY_DAYS;

    const plannedSpendToDate = elapsed.reduce((s, d) => s + d.plannedMinor, 0n);
    const actualSpendToDate = elapsed.reduce((s, d) => s + d.actualMinor, 0n);
    const accumulated = await this.getAccumulatedSavingsMinor(userId, plan);
    const breakdown = this.budgetFromPlan(plan, accumulated);

    const result = calculateForecast({
      daysElapsed: elapsed.length,
      daysTotal: days.length,
      plannedSpendToDateMinor: plannedSpendToDate,
      actualSpendToDateMinor: actualSpendToDate,
      plannedSavingsMonthlyMinor: breakdown.plannedSavingsMonthlyMinor,
      actualSavingsToDateMinor: this.inferSavingsToDate(
        elapsed,
        breakdown.plannedSavingsMonthlyMinor,
        breakdown.daysInCurrentMonth,
      ),
      targetAmountMinor: parseMinorUnits(plan.targetAmount),
      accumulatedMinor: accumulated,
      asOf: new Date(),
      targetDate: parseDateKey(plan.targetDate),
      hasEnoughHistory,
    });

    return {
      dataStatus: result.dataStatus,
      trackStatus: result.trackStatus,
      expectedSpending:
        result.expectedSpendingMinor === null
          ? null
          : fromMinorUnits(result.expectedSpendingMinor),
      expectedSavings:
        result.expectedSavingsMinor === null
          ? null
          : fromMinorUnits(result.expectedSavingsMinor),
      expectedAccumulated:
        result.expectedAccumulatedMinor === null
          ? null
          : fromMinorUnits(result.expectedAccumulatedMinor),
      expectedCompletionDate: result.expectedCompletionDate,
      onTrack: result.onTrack,
    };
  }

  async getBaseline(userId: string): Promise<FinancialPlanBaselineDto> {
    const plan = await this.findActivePlan(userId);
    const start = parseDateKey(plan.startDate);
    const lookbackStart = new Date(start);
    lookbackStart.setUTCDate(
      lookbackStart.getUTCDate() - FINANCIAL_PLAN_BASELINE_LOOKBACK_DAYS,
    );

    const historicalTx = await this.transactionModel.findAll({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        occurredAt: {
          [Op.gte]: lookbackStart,
          [Op.lt]: start,
        },
      },
    });

    const historyDays = Math.max(
      1,
      Math.floor(
        (start.getTime() - lookbackStart.getTime()) / MS_PER_DAY,
      ),
    );
    const historicalTotal = historicalTx.reduce(
      (s, tx) => s + parseMinorUnits(tx.amount),
      0n,
    );
    const hasEnoughHistory =
      historicalTx.length > 0 && historyDays >= FINANCIAL_PLAN_MIN_HISTORY_DAYS;

    const historicalAverageMonthly = hasEnoughHistory
      ? (historicalTotal * 30n) / BigInt(historyDays)
      : null;

    const planTx = await this.transactionModel.findAll({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        occurredAt: { [Op.gte]: start },
      },
    });
    const planExpenses = planTx.reduce(
      (s, tx) => s + parseMinorUnits(tx.amount),
      0n,
    );
    const planDays = Math.max(
      1,
      Math.floor((Date.now() - start.getTime()) / MS_PER_DAY) + 1,
    );

    const result = calculateBaselineSavings({
      historicalAverageMonthlyExpensesMinor: historicalAverageMonthly,
      planPeriodExpensesMinor: planExpenses,
      planPeriodDays: planDays,
      hasEnoughHistory,
    });

    return {
      dataStatus: result.dataStatus,
      historicalAverageMonthlyExpenses:
        result.historicalAverageMonthlyExpensesMinor === null
          ? null
          : fromMinorUnits(result.historicalAverageMonthlyExpensesMinor),
      projectedMonthlyExpensesUnderPlan:
        result.projectedMonthlyExpensesUnderPlanMinor === null
          ? null
          : fromMinorUnits(result.projectedMonthlyExpensesUnderPlanMinor),
      savedVersusBaseline:
        result.savedVersusBaselineMinor === null
          ? null
          : fromMinorUnits(result.savedVersusBaselineMinor),
    };
  }

  // --- internals -----------------------------------------------------------

  private async findActivePlan(userId: string): Promise<FinancialPlan> {
    const plan = await this.planModel.findOne({
      where: { userId, status: FinancialPlanStatus.ACTIVE },
      include: [
        { model: FinancialPlanCategory, include: [Category] },
        FinancialPlanDay,
      ],
    });
    if (!plan) {
      throw new NotFoundException(FINANCIAL_PLAN_ERROR_MESSAGES.PLAN_NOT_FOUND);
    }
    return plan;
  }

  private async assertCategories(
    userId: string,
    categoryIds: string[],
  ): Promise<void> {
    for (const categoryId of categoryIds) {
      const category = await this.categoryModel.findByPk(categoryId);
      if (
        !category ||
        (category.userId && category.userId !== userId) ||
        category.type !== TransactionType.EXPENSE
      ) {
        throw new BadRequestException(
          FINANCIAL_PLAN_ERROR_MESSAGES.INVALID_CATEGORY,
        );
      }
    }
  }

  private async seedPlanDays(
    planId: string,
    from: string,
    to: string,
    dailyMinor: bigint,
  ): Promise<void> {
    const dates = eachDateInclusive(from, to);
    await this.planDayModel.bulkCreate(
      dates.map((date) => ({
        financialPlanId: planId,
        date,
        plannedAmount: formatMinorUnits(dailyMinor),
        locked: false,
      })),
    );
  }

  /**
   * After a plan parameter change: keep locked historical days, rebuild
   * today+future with the new daily budget, then redistribute using actuals.
   */
  private async rebuildFutureDays(
    plan: FinancialPlan,
    today: string,
  ): Promise<void> {
    const accumulated = await this.getAccumulatedSavingsMinor(
      plan.userId,
      plan,
    );
    const breakdown = this.budgetFromPlan(plan, accumulated);
    const targetKey = plan.targetDate;

    await this.planDayModel.destroy({
      where: {
        financialPlanId: plan.id,
        date: { [Op.gte]: today },
        locked: false,
      },
    });

    const existing = await this.planDayModel.findAll({
      where: { financialPlanId: plan.id },
    });
    const existingDates = new Set(existing.map((d) => d.date));
    const toCreate = eachDateInclusive(today, targetKey).filter(
      (d) => !existingDates.has(d),
    );

    if (toCreate.length > 0) {
      await this.planDayModel.bulkCreate(
        toCreate.map((date) => ({
          financialPlanId: plan.id,
          date,
          plannedAmount: formatMinorUnits(breakdown.dailySpendingBudgetMinor),
          locked: false,
        })),
      );
    }

    await this.recalculateInternal(plan);
  }

  private async recalculateInternal(plan: FinancialPlan): Promise<void> {
    const today = toDateKey(new Date());
    const dayRows = await this.planDayModel.findAll({
      where: { financialPlanId: plan.id },
      order: [["date", "ASC"]],
    });

    if (dayRows.length === 0) {
      const accumulated = await this.getAccumulatedSavingsMinor(
        plan.userId,
        plan,
      );
      const breakdown = this.budgetFromPlan(plan, accumulated);
      await this.seedPlanDays(
        plan.id,
        plan.startDate,
        plan.targetDate,
        breakdown.dailySpendingBudgetMinor,
      );
      return this.recalculateInternal(plan);
    }

    // Lock past days so history stays immutable.
    const toLock = dayRows.filter((d) => d.date < today && !d.locked);
    for (const row of toLock) {
      await row.update({ locked: true });
    }

    const actuals = await this.loadDailyExpenseActuals(
      plan.userId,
      plan.startDate,
      plan.targetDate,
    );

    const redistributed = redistributeBudget({
      days: dayRows.map((d) => ({
        date: d.date,
        plannedMinor: parseMinorUnits(d.plannedAmount),
        locked: d.locked || d.date < today,
      })),
      actualsByDate: actuals,
      today,
    });

    for (const day of redistributed) {
      if (day.date < today) continue;
      const row = dayRows.find((r) => r.date === day.date);
      if (!row || row.locked) continue;
      if (parseMinorUnits(row.plannedAmount) !== day.plannedMinor) {
        await row.update({
          plannedAmount: formatMinorUnits(day.plannedMinor),
        });
      }
    }
  }

  private async loadDailyExpenseActuals(
    userId: string,
    from: string,
    to: string,
  ): Promise<Map<string, bigint>> {
    const txs = await this.transactionModel.findAll({
      where: {
        userId,
        type: TransactionType.EXPENSE,
        occurredAt: {
          [Op.gte]: parseDateKey(from),
          [Op.lte]: new Date(`${to}T23:59:59.999Z`),
        },
      },
    });
    const map = new Map<string, bigint>();
    for (const tx of txs) {
      const key = toDateKey(tx.occurredAt);
      map.set(key, (map.get(key) ?? 0n) + parseMinorUnits(tx.amount));
    }
    return map;
  }

  private async loadRedistributedDays(plan: FinancialPlan) {
    await this.recalculateInternal(plan);
    const today = toDateKey(new Date());
    const dayRows = await this.planDayModel.findAll({
      where: { financialPlanId: plan.id },
      order: [["date", "ASC"]],
    });
    const actuals = await this.loadDailyExpenseActuals(
      plan.userId,
      plan.startDate,
      plan.targetDate,
    );
    return redistributeBudget({
      days: dayRows.map((d) => ({
        date: d.date,
        plannedMinor: parseMinorUnits(d.plannedAmount),
        locked: d.locked || d.date < today,
      })),
      actualsByDate: actuals,
      today,
    });
  }

  private budgetFromPlan(plan: FinancialPlan, accumulatedMinor: bigint) {
    const categories = plan.categories ?? [];
    const categoryLimitsMinor = categories.reduce(
      (s, c) => s + parseMinorUnits(c.limitAmount),
      0n,
    );
    return calculateBudgetBreakdown({
      incomeMinor: parseMinorUnits(plan.income),
      mandatoryExpensesMinor: parseMinorUnits(plan.mandatoryExpenses),
      desiredSavingsMinor: parseMinorUnits(plan.desiredSavings),
      targetAmountMinor: parseMinorUnits(plan.targetAmount),
      accumulatedTowardGoalMinor: accumulatedMinor,
      targetDate: parseDateKey(plan.targetDate),
      asOf: new Date(),
      categoryLimitsMinor,
    });
  }

  private async getAccumulatedSavingsMinor(
    userId: string,
    plan: FinancialPlan,
  ): Promise<bigint> {
    // Prefer jar balances as goal progress; fall back to plan underspend savings.
    const jars = await this.accountModel.findAll({
      where: { userId, type: AccountType.JAR, isActive: true },
    });
    if (jars.length > 0) {
      return jars.reduce((s, a) => s + parseMinorUnits(a.balance), 0n);
    }

    const days = await this.planDayModel.findAll({
      where: { financialPlanId: plan.id },
    });
    const today = toDateKey(new Date());
    const actuals = await this.loadDailyExpenseActuals(
      userId,
      plan.startDate,
      today,
    );
    let saved = 0n;
    for (const day of days) {
      if (day.date > today) break;
      const planned = parseMinorUnits(day.plannedAmount);
      const actual = actuals.get(day.date) ?? 0n;
      if (planned > actual) saved += planned - actual;
    }
    return saved;
  }

  private inferSavingsToDate(
    elapsed: Array<{ plannedMinor: bigint; actualMinor: bigint }>,
    monthlySavings: bigint,
    daysInCurrentMonth: number,
  ): bigint {
    const underspend = elapsed.reduce((s, d) => {
      const diff = d.plannedMinor - d.actualMinor;
      return s + (diff > 0n ? diff : 0n);
    }, 0n);
    const prorated =
      (monthlySavings * BigInt(elapsed.length)) /
      BigInt(Math.max(1, daysInCurrentMonth));
    return underspend + prorated;
  }

  private async buildPlanResponse(
    plan: FinancialPlan,
  ): Promise<FinancialPlanResponseDto> {
    await plan.reload({
      include: [
        { model: FinancialPlanCategory, include: [Category] },
        FinancialPlanDay,
      ],
    });

    const days = await this.loadRedistributedDays(plan);
    const today = toDateKey(new Date());
    const todayDays = days.filter((d) => d.date === today);
    const current = aggregatePeriod(
      todayDays.length > 0 ? todayDays : days.slice(0, 1),
    );

    const accumulated = await this.getAccumulatedSavingsMinor(
      plan.userId,
      plan,
    );
    const breakdown = this.budgetFromPlan(plan, accumulated);
    const progress = calculatePlanProgress({
      targetAmountMinor: parseMinorUnits(plan.targetAmount),
      accumulatedMinor: accumulated,
      monthlySavingsMinor: breakdown.plannedSavingsMonthlyMinor,
      asOf: new Date(),
      targetDate: parseDateKey(plan.targetDate),
    });

    const elapsed = days.filter((d) => d.date <= today);
    const actualExpenses = elapsed.reduce((s, d) => s + d.actualMinor, 0n);
    const actualSavings = this.inferSavingsToDate(
      elapsed,
      breakdown.plannedSavingsMonthlyMinor,
      breakdown.daysInCurrentMonth,
    );

    const categories = await this.buildCategoryDtos(plan);

    return {
      id: plan.id,
      status: plan.status,
      frequency: plan.frequency,
      currency: plan.currency,
      startDate: plan.startDate,
      targetDate: plan.targetDate,
      mandatoryExpenses: fromMinorUnits(plan.mandatoryExpenses),
      averageExpenses: fromMinorUnits(plan.averageExpenses),
      overview: {
        income: fromMinorUnits(plan.income),
        plannedExpenses: fromMinorUnits(breakdown.monthlySpendingBudgetMinor),
        actualExpenses: fromMinorUnits(actualExpenses),
        plannedSavings: fromMinorUnits(breakdown.plannedSavingsMonthlyMinor),
        actualSavings: fromMinorUnits(actualSavings),
        goal: plan.goal,
        targetAmount: fromMinorUnits(plan.targetAmount),
        progress: {
          accumulated: fromMinorUnits(progress.accumulatedMinor),
          targetAmount: fromMinorUnits(progress.targetAmountMinor),
          remaining: fromMinorUnits(progress.remainingMinor),
          percentageComplete: progress.percentageComplete,
          projectedCompletionDate: progress.projectedCompletionDate,
        },
      },
      currentPeriod: {
        from: today,
        to: today,
        planned: fromMinorUnits(current.plannedMinor),
        actual: fromMinorUnits(current.actualMinor),
        remaining: fromMinorUnits(current.remainingMinor),
        saved: fromMinorUnits(current.savedMinor),
        variance: fromMinorUnits(current.varianceMinor),
        status: current.status,
      },
      categories,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }

  private async buildCategoryDtos(
    plan: FinancialPlan,
  ): Promise<FinancialPlanCategoryResponseDto[]> {
    const rows =
      plan.categories ??
      (await this.planCategoryModel.findAll({
        where: { financialPlanId: plan.id },
        include: [Category],
      }));

    const start = parseDateKey(plan.startDate);
    const txs = await this.transactionModel.findAll({
      where: {
        userId: plan.userId,
        type: TransactionType.EXPENSE,
        occurredAt: { [Op.gte]: start },
        categoryId: { [Op.ne]: null },
      },
    });

    const spendByCategory = new Map<string, bigint>();
    for (const tx of txs) {
      if (!tx.categoryId) continue;
      spendByCategory.set(
        tx.categoryId,
        (spendByCategory.get(tx.categoryId) ?? 0n) + parseMinorUnits(tx.amount),
      );
    }

    return rows.map((row) =>
      toFinancialPlanCategoryResponse(
        calculateCategoryVariance({
          categoryId: row.categoryId,
          name: row.category?.name ?? "Unknown",
          limitMinor: parseMinorUnits(row.limitAmount),
          isMandatory: row.isMandatory,
          actualMinor: spendByCategory.get(row.categoryId) ?? 0n,
        }),
      ),
    );
  }
}
