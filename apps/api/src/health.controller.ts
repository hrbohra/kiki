import { Controller, Get } from '@nestjs/common';
import { WorldService } from './world/world.service';

/** Plain REST health/summary endpoint for quick smoke checks (curl-friendly). */
@Controller()
export class HealthController {
  constructor(private readonly world: WorldService) {}

  @Get('health')
  health(): { ok: true } {
    return { ok: true };
  }

  @Get('summary')
  async summary(): Promise<{ members: number; listings: number; viewerId: string }> {
    const { members, listings, viewerId } = await this.world.data();
    return { members: members.length, listings: listings.length, viewerId };
  }
}
