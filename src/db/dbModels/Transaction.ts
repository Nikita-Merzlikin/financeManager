import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { User } from "./User";
import { Account } from "./Account";
import { Category } from "./Category";

@Table({
  tableName: "Transactions",
  timestamps: true,
})
export class Transaction extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Account)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare accountId: string;

  @BelongsTo(() => Account)
  declare account: Account;

  @ForeignKey(() => Category)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare categoryId: string | null;

  @BelongsTo(() => Category)
  declare category: Category | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare type: "income" | "expense";

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
  })
  declare amount: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "UAH",
  })
  declare currency: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare occurredAt: Date;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "manual",
  })
  declare source: "manual" | "monobank" | "privat";

  @Column({
    type: DataType.STRING,
    allowNull: true,
    unique: true,
  })
  declare externalId: string | null;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare mcc: number | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
