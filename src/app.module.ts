import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { FirstModule } from "./first/first.module";
import { UserModule } from './user/user.module';

@Module({
  imports: [FirstModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
