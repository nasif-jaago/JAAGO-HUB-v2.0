import { describe, it, expect, vi } from "vitest";
import { EventBus } from "../src/event-bus.js";
import { OutboxPublisher, type OutboxRepository, type OutboxRecord } from "../src/outbox/outbox-service.js";
import type { DomainEvent } from "../src/domain-event.js";

describe("EventBus", () => {
  it("delivers published events to subscribers", async () => {
    const bus = new EventBus();
    const handler = vi.fn();

    const unsubscribe = bus.subscribe("employee.created", handler);

    const event: DomainEvent = {
      id: "ev_1",
      name: "employee.created",
      orgId: "org_1",
      correlationId: "cor_1",
      timestamp: new Date().toISOString(),
      payload: { employeeId: "emp_1" },
      version: 1,
    };

    await bus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);

    // Test unsubscribe
    unsubscribe();
    await bus.publish(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

describe("OutboxPublisher", () => {
  it("processes pending records and publishes them via EventBus", async () => {
    const bus = new EventBus();
    const publishedEvents: DomainEvent[] = [];
    bus.subscribe("leave.approved", (e) => {
      publishedEvents.push(e);
    });

    const mockPending: OutboxRecord[] = [
      {
        id: "outbox_1",
        orgId: "org_1",
        eventName: "leave.approved",
        correlationId: "cor_1",
        payload: { requestId: "req_1" },
        status: "pending",
        retryCount: 0,
        createdAt: new Date().toISOString(),
      },
    ];

    const mockRepo: OutboxRepository = {
      save: vi.fn(),
      fetchPending: vi.fn().mockResolvedValue(mockPending),
      markPublished: vi.fn().mockResolvedValue(undefined),
      markFailed: vi.fn().mockResolvedValue(undefined),
    };

    const publisher = new OutboxPublisher(mockRepo, bus);
    const count = await publisher.processBatch(10);

    expect(count).toBe(1);
    expect(mockRepo.fetchPending).toHaveBeenCalledWith(10);
    expect(mockRepo.markPublished).toHaveBeenCalledWith("outbox_1");
    expect(publishedEvents).toHaveLength(1);
    expect(publishedEvents[0]?.name).toBe("leave.approved");
  });
});
