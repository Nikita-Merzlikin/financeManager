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
  tableName: "UserProfiles",
  timestamps: true,
})
export class UserProfile extends Model {
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
    unique: true,
  })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare firstName: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare lastName: string | null;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare avatar: string | null;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string | null;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare dateOfBirth: string | null;

  declare createdAt: Date;
  declare updatedAt: Date;
}
