import { describe, it, expect, vi } from "vitest";
import { QueueManager } from "../src/queue-manager.js";
import type { JobDefinition, BaseJobPayload } from "../src/job-base.js";

// Mock BullMQ Queue and Worker to test QueueManager integration
vi.mock("bullmq", () => {
  return {
    Queue: vi.fn().mockImplementation((name) => {
      return {
        name,
        add: vi.fn().mockImplementation((jobName, payload, options) => {
          return Promise.resolve({
            id: options?.jobId ?? `job_${Date.now()}`,
            name: jobName,
            data: payload,
          });
        }),
        close: vi.fn().mockResolvedValue(undefined),
      };
    }),
    Worker: vi.fn().mockImplementation((name, processor) => {
      return {
        name,
        processor,
        close: vi.fn().mockResolvedValue(undefined),
      };
    }),
  };
});

describe("QueueManager", () => {
  const fakeRedis = {} as unknown as never;
  const manager = new QueueManager(fakeRedis);

  it("enqueues jobs with typed payloads and custom deduplication keys", async () => {
    interface EmailPayload extends BaseJobPayload {
      to: string;
      subject: string;
    }

    const jobDef: JobDefinition<EmailPayload> = {
      queueName: "emails",
      jobName: "send-welcome",
      deduplicationKey: "welcome:user_123",
      payload: {
        to: "nasif@jaago.com.bd",
        subject: "Welcome to JAAGO HUB",
        correlationId: "cor_1",
        orgId: "org_1",
        timestamp: new Date().toISOString(),
      },
    };

    const jobId = await manager.enqueue(jobDef);
    expect(jobId).toBe("welcome:user_123");
  });

  it("registers workers and manages lifecycle", async () => {
    const processor = vi.fn().mockResolvedValue(undefined);
    const worker = manager.registerWorker("emails", processor);

    expect(worker).toBeDefined();
    await expect(manager.closeAll()).resolves.toBeUndefined();
  });
});
