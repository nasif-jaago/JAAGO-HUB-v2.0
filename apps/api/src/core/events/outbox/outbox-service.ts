import type { DomainEvent } from "../domain-event.js";
import type { EventBus } from "../event-bus.js";

export interface OutboxRecord {
  id: string;
  orgId: string;
  eventName: string;
  correlationId: string;
  payload: Record<string, unknown>;
  status: "pending" | "published" | "failed";
  retryCount: number;
  createdAt: string;
  processedAt?: string;
  errorMessage?: string;
}

export interface OutboxRepository {
  save(record: Omit<OutboxRecord, "id" | "status" | "retryCount" | "createdAt">): Promise<OutboxRecord>;
  fetchPending(limit: number): Promise<OutboxRecord[]>;
  markPublished(id: string): Promise<void>;
  markFailed(id: string, error: string): Promise<void>;
}

export class OutboxPublisher {
  private readonly repository: OutboxRepository;
  private readonly eventBus: EventBus;

  constructor(repository: OutboxRepository, eventBus: EventBus) {
    this.repository = repository;
    this.eventBus = eventBus;
  }

  /**
   * Process and dispatch a batch of pending outbox events.
   * Returns the count of successfully dispatched events.
   */
  async processBatch(batchSize = 50): Promise<number> {
    const pendingRecords = await this.repository.fetchPending(batchSize);
    let dispatched = 0;

    for (const record of pendingRecords) {
      try {
        const domainEvent: DomainEvent = {
          id: record.id,
          name: record.eventName,
          orgId: record.orgId,
          correlationId: record.correlationId,
          timestamp: record.createdAt,
          payload: record.payload,
          version: 1,
        };

        await this.eventBus.publish(domainEvent);
        await this.repository.markPublished(record.id);
        dispatched++;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        await this.repository.markFailed(record.id, message);
      }
    }

    return dispatched;
  }
}
