import Redis from 'ioredis';
import type { MessageBus } from './message-bus';

/** Redis-backed pub/sub — the scale port. Activated by MESSAGE_BUS=redis + REDIS_URL, so real-time
 *  fans out across multiple API instances. Uses two connections (Redis requires a dedicated
 *  subscriber). Drop-in for InMemoryMessageBus; no service code changes. */
export class RedisMessageBus implements MessageBus {
  private readonly pub: Redis;
  private readonly sub: Redis;
  private readonly handlers = new Map<string, Set<(payload: unknown) => void>>();

  constructor(url: string) {
    this.pub = new Redis(url);
    this.sub = new Redis(url);
    this.sub.on('message', (channel: string, message: string) => {
      const set = this.handlers.get(channel);
      if (!set) return;
      let payload: unknown;
      try {
        payload = JSON.parse(message);
      } catch {
        payload = message;
      }
      for (const h of set) h(payload);
    });
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    await this.pub.publish(channel, JSON.stringify(payload));
  }

  subscribe(channel: string, handler: (payload: unknown) => void): () => void {
    let set = this.handlers.get(channel);
    if (!set) {
      set = new Set();
      this.handlers.set(channel, set);
      void this.sub.subscribe(channel);
    }
    set.add(handler);
    return () => {
      const s = this.handlers.get(channel);
      if (!s) return;
      s.delete(handler);
      if (s.size === 0) {
        this.handlers.delete(channel);
        void this.sub.unsubscribe(channel);
      }
    };
  }
}
