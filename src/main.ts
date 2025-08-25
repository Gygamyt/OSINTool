import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app/app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ZodValidationPipe } from "nestjs-zod";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ZodValidationPipe())

  const config = new DocumentBuilder()
    .setTitle("OSINT Company Pipeline API")
    .setDescription("API для запуска пайплайнов OSINT-агентов для анализа компаний",)
    .setVersion("1.0")
    .addTag("osint")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  // http://localhost:3000/api
  SwaggerModule.setup("api", app, document);

  await app.listen(3000);
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger UI is available at: ${await app.getUrl()}/api`);
}

bootstrap();
