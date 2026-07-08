import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MyTestModule } from './my-test/my-test.module';
import { TestMyModule } from './test-my/test-my.module';
import { FirstModule } from './first/first.module';

@Module({
  imports: [MyTestModule, TestMyModule, FirstModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
