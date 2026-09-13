import { Module } from '@nestjs/common';
import { WorldRepository } from './world.repository';
import { WorldService } from './world.service';

@Module({
  providers: [WorldRepository, WorldService],
  exports: [WorldService],
})
export class WorldModule {}
