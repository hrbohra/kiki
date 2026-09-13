import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { AppModule } from './app.module';
import { appRouter } from './trpc/app.router';
import { WorldService } from './world/world.service';
import { AuthService } from './auth/auth.service';
import { RequestsService } from './writes/requests.service';
import { TripsService } from './writes/trips.service';
import { GuestBookService } from './writes/guestbook.service';
import { MessagingService } from './messaging/messaging.service';
import { MediaService } from './media/media.service';
import { UPLOADS_DIR } from './media/media.module';
import { makeCreateContext, makeCreateWsContext, type ContextDeps } from './trpc/context';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.enableShutdownHooks();

  // Serve locally-stored uploads (no-op when using Vercel Blob, which serves from its own CDN).
  app.useStaticAssets(UPLOADS_DIR, { prefix: '/media/' });

  // Resolve the services once; share them between the HTTP and WebSocket transports.
  const deps: ContextDeps = {
    world: app.get(WorldService),
    auth: app.get(AuthService),
    requests: app.get(RequestsService),
    trips: app.get(TripsService),
    guestbook: app.get(GuestBookService),
    messaging: app.get(MessagingService),
    media: app.get(MediaService),
  };

  // HTTP: mount tRPC on Nest's Express instance.
  const express = app.getHttpAdapter().getInstance();
  express.use('/trpc', createExpressMiddleware({ router: appRouter, createContext: makeCreateContext(deps) }));

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 4000;
  await app.listen(port);

  // WebSocket: attach a tRPC WS handler to the same HTTP server for subscriptions.
  const wss = new WebSocketServer({ server: app.getHttpServer() });
  const wsHandler = applyWSSHandler({ wss, router: appRouter, createContext: makeCreateWsContext(deps) });
  app.getHttpServer().on('close', () => wsHandler.broadcastReconnectNotification());

  // eslint-disable-next-line no-console
  console.log(`Kiki API on http://localhost:${port}  (REST /health, /summary · tRPC /trpc · WS /trpc)`);
}

void bootstrap();
