import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { User } from "./User";
import { BankConnection } from "./BankConnection";
import { Transaction } from "./Transaction";

@Table({
  tableName: "Accounts",
  timestamps: true,
})
export class Account extends Model {
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

  @ForeignKey(() => BankConnection)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare bankConnectionId: string | null;

  @BelongsTo(() => BankConnection)
  declare bankConnection: BankConnection | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "manual",
  })
  declare source: "manual" | "monobank" | "privat";

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "card",
  })
  declare type: "cash" | "card" | "bank" | "jar" | "fop" | "other";

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: "UAH",
  })
  declare currency: string;

  @Column({
    type: DataType.DECIMAL(14, 2),
    allowNull: false,
    defaultValue: 0,
  })
  declare balance: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare externalId: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare iban: string | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  @HasMany(() => Transaction)
  declare transactions: Transaction[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
