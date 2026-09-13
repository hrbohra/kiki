import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorldModule } from './world/world.module';
import { AuthModule } from './auth/auth.module';
import { WritesModule } from './writes/writes.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, WorldModule, AuthModule, WritesModule],
  controllers: [HealthController],
})
export class AppModule {}
