import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { AccountDto } from "src/core/dto/finance.dto";
import {
  AccountSource,
  AccountType,
  DEFAULT_ACCOUNT_TYPE,
  DEFAULT_CURRENCY,
} from "src/core/enums/finance.enums";
import { fromMinorUnits } from "src/finance/finance.utils";
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
    type: DataType.ENUM(...Object.values(AccountSource)),
    allowNull: false,
    defaultValue: AccountSource.MANUAL,
  })
  declare source: AccountSource;

  @Column({
    type: DataType.ENUM(...Object.values(AccountType)),
    allowNull: false,
    defaultValue: DEFAULT_ACCOUNT_TYPE,
  })
  declare type: AccountType;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: DEFAULT_CURRENCY,
  })
  declare currency: string;

  /** Stored as BIGINT minor units (cents). Convert only at API boundary. */
  @Column({
    type: DataType.BIGINT,
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

  @HasMany(() => Transaction, { onDelete: "CASCADE", hooks: true })
  declare transactions: Transaction[];

  declare createdAt: Date;
  declare updatedAt: Date;

  toDto(): AccountDto {
    return {
      id: this.id,
      name: this.name,
      source: this.source,
      type: this.type,
      currency: this.currency,
      balance: fromMinorUnits(this.balance),
      iban: this.iban,
      isActive: this.isActive,
      bankConnectionId: this.bankConnectionId,
    };
  }
}
