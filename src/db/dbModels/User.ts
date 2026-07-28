import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript";
import { Session } from "./Session";

@Table({
  tableName: "Users",
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  declare id: number;

  @Column({
    type: DataType.STRING,
  })
  declare firstName: string;

  @Column({
    type: DataType.STRING,
  })
  declare lastName: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @HasMany(() => Session)
  declare sessions: Session[];

  declare createdAt: Date;
  declare updatedAt: Date;
}
