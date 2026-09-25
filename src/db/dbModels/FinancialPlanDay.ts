import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { FinancialPlan } from "./FinancialPlan";

@Table({
  tableName: "FinancialPlanDays",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["financialPlanId", "date"],
      name: "financial_plan_days_plan_date_unique",
    },
  ],
})
export class FinancialPlanDay extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => FinancialPlan)
  @Column({ type: DataType.UUID, allowNull: false })
  declare financialPlanId: string;

  @BelongsTo(() => FinancialPlan)
  declare financialPlan: FinancialPlan;

  @Column({ type: DataType.DATEONLY, allowNull: false })
  declare date: string;

  /** Planned spending for the day in BIGINT minor units */
  @Column({ type: DataType.BIGINT, allowNull: false })
  declare plannedAmount: string;

  /**
   * Locked days are historical: plannedAmount must not change on redistribution
   * or plan parameter updates (past remains accurate).
   */
  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare locked: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}
