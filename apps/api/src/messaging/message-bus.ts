import { EventEmitter } from 'node:events';

/** DI token for the pub/sub implementation. */
export const MESSAGE_BUS = Symbol('MESSAGE_BUS');

/** Pub/sub port. Swapping the implementation (in-memory ↔ Redis) needs no service changes —
 *  the seam that lets real-time scale across instances later. */
export interface MessageBus {
  publish(channel: string, payload: unknown): Promise<void>;
  /** Returns an unsubscribe function. */
  subscribe(channel: string, handler: (payload: unknown) => void): () => void;
}

/** Single-instance default: an in-process EventEmitter. Verified path for dev + one server. */
export class InMemoryMessageBus implements MessageBus {
  private readonly ee = new EventEmitter();

  constructor() {
    this.ee.setMaxListeners(0);
  }

  async publish(channel: string, payload: unknown): Promise<void> {
    this.ee.emit(channel, payload);
  }

  subscribe(channel: string, handler: (payload: unknown) => void): () => void {
    this.ee.on(channel, handler);
    return () => this.ee.off(channel, handler);
  }
}
