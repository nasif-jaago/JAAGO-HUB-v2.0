import type { Job } from "bullmq";
import { getLogger } from "@jaago/logger";
import type { BaseJobPayload } from "@jaago/queue";

export interface CleanupJobData extends BaseJobPayload {
  taskName: string;
}

export async function processCleanupJob(job: Job<CleanupJobData>): Promise<{ success: boolean; cleanedCount: number }> {
  const logger = getLogger();
  const { taskName, correlationId } = job.data;

  logger.info(
    {
      jobId: job.id,
      queue: "cleanup",
      taskName,
      correlationId,
    },
    `Executing periodic maintenance and cleanup task: ${taskName}`,
  );

  return { success: true, cleanedCount: 0 };
}
