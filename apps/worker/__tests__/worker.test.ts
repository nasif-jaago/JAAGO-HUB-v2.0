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
        templateId: "leave_decision",
        templateVariables: {
          employeeName: "Nasif Kamal",
          leaveType: "Annual Leave",
          days: 2,
          status: "APPROVED",
        },
        correlationId: "cor_test_123",
        orgId: "org_1",
        timestamp: new Date().toISOString(),
      },
    } as unknown as Job<SendEmailJobData>;

    const result = await processEmailJob(fakeJob);

    expect(result.success).toBe(true);
    expect(result.messageId).toBeDefined();
    expect(result.messageId.length).toBeGreaterThan(5);
  });

  it("processes session and temp resource cleanup jobs", async () => {
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
    expect(result.cleanedCount).toBeGreaterThan(0);
    expect(result.taskName).toBe("purge_expired_sessions");
  });

  it("processes stale exports cleanup job", async () => {
    const fakeJob = {
      id: "job_clean_2",
      data: {
        taskName: "purge_stale_exports",
        correlationId: "cor_clean_2",
        orgId: "org_1",
        retentionDays: 7,
        timestamp: new Date().toISOString(),
      },
    } as unknown as Job<CleanupJobData>;

    const result = await processCleanupJob(fakeJob);

    expect(result.success).toBe(true);
    expect(result.cleanedCount).toBe(8);
  });
});
