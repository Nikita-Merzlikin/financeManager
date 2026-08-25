import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./db/db.module";
import { FinanceModule } from "./finance/finance.module";
import { ProfileModule } from "./profile/profile.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [
    DatabaseModule,
    UserModule,
    AuthModule,
    ProfileModule,
    FinanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
