import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import {
  AccountSource,
  TransactionType,
} from "src/core/enums/finance.enums";
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
    type: DataType.ENUM(...Object.values(TransactionType)),
    allowNull: false,
  })
  declare type: TransactionType;

  /** Stored as BIGINT minor units (cents). Convert only at API boundary. */
  @Column({
    type: DataType.BIGINT,
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
    type: DataType.ENUM(...Object.values(AccountSource)),
    allowNull: false,
    defaultValue: AccountSource.MANUAL,
  })
  declare source: AccountSource;

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
