import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { AppModule } from './app.module';
import { appRouter } from './trpc/app.router';
import { WorldService } from './world/world.service';
import { AuthService } from './auth/auth.service';
import { RequestsService } from './writes/requests.service';
import { TripsService } from './writes/trips.service';
import { GuestBookService } from './writes/guestbook.service';
import { makeCreateContext } from './trpc/context';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.enableShutdownHooks();

  // Mount the tRPC router on Nest's underlying Express instance. Services are resolved from the
  // Nest container; the context factory also resolves the current user from the auth header.
  const express = app.getHttpAdapter().getInstance();
  express.use(
    '/trpc',
    createExpressMiddleware({
      router: appRouter,
      createContext: makeCreateContext({
        world: app.get(WorldService),
        auth: app.get(AuthService),
        requests: app.get(RequestsService),
        trips: app.get(TripsService),
        guestbook: app.get(GuestBookService),
      }),
    }),
  );

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Kiki API on http://localhost:${port}  (REST /health, /summary · tRPC /trpc)`);
}

void bootstrap();
