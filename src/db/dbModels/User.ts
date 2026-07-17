import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
} from "sequelize-typescript";

@Table({
  tableName: "Users",
  timestamps: true,
})
export class User extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
  })
  firstName!: string;

  @Column({
    type: DataType.STRING,
  })
  lastName!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string;
}
