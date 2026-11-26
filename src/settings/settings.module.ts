import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { UserSettings } from "src/db/dbModels/UserSettings";
import { ProfileModule } from "src/profile/profile.module";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Module({
  imports: [SequelizeModule.forFeature([UserSettings]), ProfileModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
