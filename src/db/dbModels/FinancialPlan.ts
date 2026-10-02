import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from "sequelize-typescript";
import { CurrencyEnum, DEFAULT_CURRENCY } from "src/core/enums/finance.enums";
import {
  FinancialPlanFrequency,
  FinancialPlanStatus,
} from "src/core/enums/financial-plan.enums";
import { User } from "./User";
import { FinancialPlanCategory } from "./FinancialPlanCategory";
import { FinancialPlanDay } from "./FinancialPlanDay";

@Table({
  tableName: "FinancialPlans",
  timestamps: true,
})
export class FinancialPlan extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.ENUM(...Object.values(FinancialPlanStatus)),
    allowNull: false,
    defaultValue: FinancialPlanStatus.ACTIVE,
  })
  declare status: FinancialPlanStatus;

  /** BIGINT minor units */
  @Column({ type: DataType.BIGINT, allowNull: false })
  declare income: string;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare averageExpenses: string;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare mandatoryExpenses: string;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare desiredSavings: string;

  @Column({ type: DataType.STRING(200), allowNull: false })
  declare goal: string;

  @Column({ type: DataType.BIGINT, allowNull: false })
  declare targetAmount: string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare targetDate: string;

  @Column({
    type: DataType.ENUM(...Object.values(FinancialPlanFrequency)),
    allowNull: false,
  })
  declare frequency: FinancialPlanFrequency;

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
    defaultValue: DEFAULT_CURRENCY,
  })
  declare currency: CurrencyEnum | string;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare startDate: string;

  @HasMany(() => FinancialPlanCategory)
  declare categories: FinancialPlanCategory[];

  @HasMany(() => FinancialPlanDay)
  declare days: FinancialPlanDay[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
