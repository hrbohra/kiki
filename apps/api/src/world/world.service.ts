import { Injectable } from '@nestjs/common';
import { createWorld, type World, type WorldData } from '@kiki/domain';
import { WorldRepository } from './world.repository';

/** Caches the composed World (graph, standings, selectors) built from DB rows.
 *  `invalidate()` is called after writes in later phases so reads recompute. */
@Injectable()
export class WorldService {
  private cache?: { data: WorldData; world: World };

  constructor(private readonly repo: WorldRepository) {}

  async load(): Promise<{ data: WorldData; world: World }> {
    if (!this.cache) {
      const data = await this.repo.load();
      this.cache = { data, world: createWorld(data) };
    }
    return this.cache;
  }

  async world(): Promise<World> {
    return (await this.load()).world;
  }

  async data(): Promise<WorldData> {
    return (await this.load()).data;
  }

  async setTrait(userId: string, input: { kind: 'origin' | 'education' | 'interest' | 'work' | 'event'; label: string; on: boolean }) {
    const r = await this.repo.setTrait(userId, input);
    this.invalidate();
    return r;
  }

  async resetDemoTraits(): Promise<number> {
    const n = await this.repo.resetDemoTraits();
    this.invalidate();
    return n;
  }

  invalidate(): void {
    this.cache = undefined;
  }
}
