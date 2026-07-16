import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { sequelize } from "./db/db";
import { ValidationPipe } from "@nestjs/common";

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ Database connected");
  } catch (e) {
    console.error("❌ Database connection failed", e);
  }
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
