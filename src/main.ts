import { NestFactory } from "@nestjs/core";
<<<<<<< Updated upstream
import { AppModule } from "./app.module";
import { sequelize } from "./db/db";
=======
>>>>>>> Stashed changes
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    console.log("✅ Database connected");
  } catch (e) {
    console.error("❌ Database connection failed", e);
  }
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle("Cats example")
    .setDescription("The cats API description")
    .setVersion("1.0")
    .addTag("cats")
    .build();

  const document = () => SwaggerModule.createDocument(app, config);

  SwaggerModule.setup("api/doc", app, document);

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
