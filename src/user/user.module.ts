import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { User } from "src/db/dbModels/User";
import { ProfileModule } from "src/profile/profile.module";
import { SettingsModule } from "src/settings/settings.module";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [SequelizeModule.forFeature([User]), ProfileModule, SettingsModule],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService, SequelizeModule],
})
export class UserModule {}
