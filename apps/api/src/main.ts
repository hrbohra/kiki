import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { AppModule } from './app.module';
import { appRouter } from './trpc/app.router';
import { WorldService } from './world/world.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.enableShutdownHooks();

  // Mount the tRPC router on Nest's underlying Express instance. WorldService is resolved
  // from the Nest container and passed into every tRPC request context.
  const world = app.get(WorldService);
  const express = app.getHttpAdapter().getInstance();
  express.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: () => ({ world }),
    }),
  );

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Kiki API on http://localhost:${port}  (REST /health, /summary · tRPC /trpc)`);
}

void bootstrap();
