import type { Job } from "bullmq";
import { getLogger } from "@jaago/logger";
import type { BaseJobPayload } from "@jaago/queue";

export interface SendEmailJobData extends BaseJobPayload {
  to: string;
  subject: string;
  templateId: string;
  templateVariables?: Record<string, unknown>;
}

export async function processEmailJob(job: Job<SendEmailJobData>): Promise<{ success: boolean; messageId: string }> {
  const logger = getLogger();
  const { to, subject, correlationId, orgId, userId } = job.data;

  logger.info(
    {
      jobId: job.id,
      queue: "emails",
      to,
      subject,
      correlationId,
      orgId,
      userId,
    },
    `Processing email job ${job.id} for recipient ${to}`,
  );

  // STUB: Real SMTP / Resend / SendGrid dispatch will be implemented in Phase 3
  const messageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  logger.info(
    {
      jobId: job.id,
      messageId,
      correlationId,
    },
    `Email successfully dispatched (stub) with message ID: ${messageId}`,
  );

  return { success: true, messageId };
}
