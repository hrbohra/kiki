import { Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { MessagingService } from './messaging.service';
import { MESSAGE_BUS, InMemoryMessageBus, type MessageBus } from './message-bus';
import { RedisMessageBus } from './redis-bus';

/** In-memory pub/sub by default; flip to Redis with MESSAGE_BUS=redis + REDIS_URL to scale
 *  real-time across instances. */
const messageBusProvider = {
  provide: MESSAGE_BUS,
  useFactory: (): MessageBus =>
    process.env.MESSAGE_BUS === 'redis' && process.env.REDIS_URL
      ? new RedisMessageBus(process.env.REDIS_URL)
      : new InMemoryMessageBus(),
};

@Module({
  imports: [WorldModule],
  providers: [MessagingService, messageBusProvider],
  exports: [MessagingService],
})
export class MessagingModule {}
