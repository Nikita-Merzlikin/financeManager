<<<<<<< Updated upstream
import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
=======
import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { UserService } from "./user.service";
import { UserController } from "./user.controller";
import { User } from "src/db/dbModels/User";
>>>>>>> Stashed changes

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
