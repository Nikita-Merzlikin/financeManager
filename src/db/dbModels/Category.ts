import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { TransactionType } from "src/core/enums/finance.enums";
import { User } from "./User";

@Table({
  tableName: "Categories",
  timestamps: true,
})
export class Category extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare userId: string | null;

  @BelongsTo(() => User)
  declare user: User | null;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.ENUM(...Object.values(TransactionType)),
    allowNull: false,
  })
  declare type: TransactionType;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare icon: string | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
