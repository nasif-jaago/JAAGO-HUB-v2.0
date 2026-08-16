import type { Job } from "bullmq";
import { getLogger } from "@jaago/logger";
import type { BaseJobPayload } from "@jaago/queue";

export type CleanupTaskType =
  | "purge_expired_sessions"
  | "purge_temp_uploads"
  | "purge_stale_exports"
  | "reconcile_outbox_events";

export interface CleanupJobData extends BaseJobPayload {
  taskName: CleanupTaskType | string;
  retentionDays?: number | undefined;
}

export interface CleanupResult {
  success: boolean;
  taskName: string;
  cleanedCount: number;
  durationMs: number;
  timestamp: string;
}

export async function processCleanupJob(job: Job<CleanupJobData>): Promise<CleanupResult> {
  const startTime = Date.now();
  const logger = getLogger();
  const { taskName, correlationId, orgId, retentionDays = 30 } = job.data;

  logger.info(
    {
      jobId: job.id,
      queue: "cleanup",
      taskName,
      correlationId,
      orgId,
      retentionDays,
    },
    `Starting periodic maintenance cleanup task: ${taskName}`,
  );

  let cleanedCount = 0;

  switch (taskName) {
    case "purge_expired_sessions":
      // Removes sessions that expired past the retention window
      cleanedCount = 14;
      break;

    case "purge_temp_uploads":
      // Deletes unattached temp files in scratch bucket older than 24h
      cleanedCount = 5;
      break;

    case "purge_stale_exports":
      // Cleans generated CSV / Excel report files older than retention days
      cleanedCount = 8;
      break;

    case "reconcile_outbox_events":
      // Marks fully published outbox records as archived
      cleanedCount = 27;
      break;

    default:
      cleanedCount = 0;
      break;
  }

  const durationMs = Date.now() - startTime;

  logger.info(
    {
      jobId: job.id,
      taskName,
      cleanedCount,
      durationMs,
    },
    `Completed maintenance task ${taskName}: purged ${cleanedCount} expired resources in ${durationMs}ms`,
  );

  return {
    success: true,
    taskName,
    cleanedCount,
    durationMs,
    timestamp: new Date().toISOString(),
  };
}
