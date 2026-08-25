import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { User } from "./User";

@Table({
  tableName: "BankConnections",
  timestamps: true,
})
export class BankConnection extends Model {
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

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare provider: "monobank" | "privat";

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare credentialsEncrypted: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare label: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastSyncedAt: Date | null;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  declare isActive: boolean;

  declare createdAt: Date;
  declare updatedAt: Date;
}
