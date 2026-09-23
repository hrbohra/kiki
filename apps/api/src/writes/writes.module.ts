import { Module } from '@nestjs/common';
import { WorldModule } from '../world/world.module';
import { IdempotencyService } from '../common/idempotency.service';
import { RequestsService } from './requests.service';
import { TripsService } from './trips.service';
import { GuestBookService } from './guestbook.service';
import { HouseListService } from './houselist.service';

@Module({
  imports: [WorldModule],
  providers: [IdempotencyService, RequestsService, TripsService, GuestBookService, HouseListService],
  exports: [RequestsService, TripsService, GuestBookService, HouseListService],
})
export class WritesModule {}
