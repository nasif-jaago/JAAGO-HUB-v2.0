import { describe, it, expect, beforeEach } from "vitest";
import type { Job } from "bullmq";
import { createLogger } from "@jaago/logger";
import { processEmailJob, type SendEmailJobData } from "../src/processors/email.processor.js";
import { processCleanupJob, type CleanupJobData } from "../src/processors/cleanup.processor.js";

describe("Worker Processors", () => {
  beforeEach(() => {
    createLogger({ serviceName: "test-worker", level: "info" });
  });

  it("processes email job successfully", async () => {
    const fakeJob = {
      id: "job_email_123",
      data: {
        to: "nasif@jaago.com.bd",
        subject: "Your Leave Request has been approved",
        templateId: "leave-approved-v1",
        correlationId: "cor_test_123",
        orgId: "org_1",
        timestamp: new Date().toISOString(),
      },
    } as unknown as Job<SendEmailJobData>;

    const result = await processEmailJob(fakeJob);

    expect(result.success).toBe(true);
    expect(result.messageId).toMatch(/^msg_/);
  });

  it("processes cleanup job successfully", async () => {
    const fakeJob = {
      id: "job_clean_1",
      data: {
        taskName: "purge_expired_sessions",
        correlationId: "cor_clean_1",
        orgId: "org_1",
        timestamp: new Date().toISOString(),
      },
    } as unknown as Job<CleanupJobData>;

    const result = await processCleanupJob(fakeJob);

    expect(result.success).toBe(true);
    expect(result.cleanedCount).toBe(0);
  });
});
