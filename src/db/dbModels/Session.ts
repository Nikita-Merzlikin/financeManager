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
  tableName: "sessions",
  timestamps: true,
})
export class Session extends Model {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare refreshToken: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare ipAddress: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare userAgent: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  declare createdAt: Date;
  declare updatedAt: Date;
}
