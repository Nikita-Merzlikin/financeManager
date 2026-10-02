import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from "sequelize-typescript";
import { Category } from "./Category";
import { FinancialPlan } from "./FinancialPlan";

@Table({
  tableName: "FinancialPlanCategories",
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ["financialPlanId", "categoryId"],
      name: "financial_plan_categories_plan_category_unique",
    },
  ],
})
export class FinancialPlanCategory extends Model {
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

  @ForeignKey(() => Category)
  @Column({ type: DataType.UUID, allowNull: false })
  declare categoryId: string;

  @BelongsTo(() => Category)
  declare category: Category;

  /** Monthly limit in BIGINT minor units */
  @Column({ type: DataType.BIGINT, allowNull: false })
  declare limitAmount: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  declare isMandatory: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}
