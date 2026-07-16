import { DataTypes } from "sequelize";
import { sequelize } from "../db";

export const User = sequelize.define("User", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  firstName: DataTypes.STRING,
  lastName: DataTypes.STRING,
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  password: { allowNull: false, type: DataTypes.STRING },
  createdAt: DataTypes.DATE,
  updatedAt: DataTypes.DATE,
});
