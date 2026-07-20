import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

import { FirstModule } from "./first/first.module";
import { UserModule } from './user/user.module';

@Module({
<<<<<<< Updated upstream
  imports: [FirstModule, UserModule],
  controllers: [AppController],
  providers: [AppService],
=======
  imports: [DatabaseModule, UserModule],
>>>>>>> Stashed changes
})
export class AppModule {}
