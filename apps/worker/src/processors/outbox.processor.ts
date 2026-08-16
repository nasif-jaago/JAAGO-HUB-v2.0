import type { Job } from "bullmq";
import { getLogger } from "@jaago/logger";
import type { BaseJobPayload } from "@jaago/queue";

export interface OutboxDispatchJobData extends BaseJobPayload {
  batchSize?: number;
}

export async function processOutboxJob(job: Job<OutboxDispatchJobData>): Promise<{ dispatched: number }> {
  const logger = getLogger();
  const { correlationId, orgId } = job.data;
  const batchSize = job.data.batchSize ?? 50;

  logger.info(
    {
      jobId: job.id,
      queue: "outbox",
      batchSize,
      correlationId,
      orgId,
    },
    `Processing transactional outbox dispatcher job ${job.id}`,
  );

  // In full Phase 3 deployment, this instantiates OutboxPublisher and drains pending records
  return { dispatched: 0 };
}
