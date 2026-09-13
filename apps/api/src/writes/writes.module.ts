import { Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { IdempotencyService } from '../common/idempotency.service';
import { RequestsService } from './requests.service';
import { TripsService } from './trips.service';
import { GuestBookService } from './guestbook.service';

@Module({
  imports: [WorldModule],
  providers: [IdempotencyService, RequestsService, TripsService, GuestBookService],
  exports: [RequestsService, TripsService, GuestBookService],
})
export class WritesModule {}
