import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { User } from "./dbModels/User";
import { Session } from "./dbModels/Session";
import { UserProfile } from "./dbModels/UserProfile";
import { Account } from "./dbModels/Account";
import { Transaction } from "./dbModels/Transaction";
import { Category } from "./dbModels/Category";
import { BankConnection } from "./dbModels/BankConnection";
import dotenv from "dotenv";

dotenv.config();

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: "postgres",
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      database: process.env.DB_NAME,
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      autoLoadModels: true,
      synchronize: true,
      models: [
        User,
        Session,
        UserProfile,
        Account,
        Transaction,
        Category,
        BankConnection,
      ],
    }),
  ],
})
export class DatabaseModule {}
