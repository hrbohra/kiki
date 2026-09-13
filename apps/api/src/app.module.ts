import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { WorldModule } from './world/world.module';
import { HealthController } from './health.controller';

@Module({
  imports: [PrismaModule, WorldModule],
  controllers: [HealthController],
})
export class AppModule {}
