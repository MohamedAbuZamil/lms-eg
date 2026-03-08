import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AssessmentModule } from './assessment.module';

async function bootstrap() {
  const app = await NestFactory.create(AssessmentModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.PORT || 3007;
  await app.listen(port);

  console.log(`Assessment Service is running on port ${port}`);
}

bootstrap();
