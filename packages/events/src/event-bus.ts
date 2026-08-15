import type { DomainEvent, EventHandler } from "./domain-event.js";

export class EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();

  /**
   * Subscribe to a specific domain event.
   */
  subscribe<T>(eventName: string, handler: EventHandler<T>): () => void {
    let set = this.handlers.get(eventName);
    if (!set) {
      set = new Set();
      this.handlers.set(eventName, set);
    }
    const genericHandler = handler as EventHandler;
    set.add(genericHandler);

    return () => {
      set?.delete(genericHandler);
    };
  }

  /**
   * Publish a domain event to all subscribers.
   */
  async publish<T>(event: DomainEvent<T>): Promise<void> {
    const set = this.handlers.get(event.name);
    if (!set || set.size === 0) return;

    const promises = Array.from(set).map(async (handler) => {
      try {
        await handler(event as DomainEvent);
      } catch (err: unknown) {
        // Individual handler failures should not crash other event handlers
        console.error(`[EventBus] Handler failed for event "${event.name}":`, err);
      }
    });

    await Promise.all(promises);
  }
}

/** Global default EventBus instance */
export const defaultEventBus = new EventBus();
