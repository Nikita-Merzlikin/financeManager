import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { AuthModule } from "./auth/auth.module";
import { DatabaseModule } from "./db/db.module";
import { FirstModule } from "./first/first.module";
import { UserModule } from "./user/user.module";

@Module({
  imports: [DatabaseModule, FirstModule, UserModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
