import { Module } from "@nestjs/common";
import { SequelizeModule } from "@nestjs/sequelize";
import { UserProfile } from "src/db/dbModels/UserProfile";
import { S3Module } from "src/s3/s3.module";
import { ProfileController } from "./profile.controller";
import { ProfileService } from "./profile.service";

@Module({
  imports: [SequelizeModule.forFeature([UserProfile]), S3Module],
  controllers: [ProfileController],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
