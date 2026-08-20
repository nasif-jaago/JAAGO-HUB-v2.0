export interface BaseJobPayload {
  correlationId: string;
  orgId: string;
  userId?: string;
  timestamp: string;
}

export interface JobDefinition<T extends BaseJobPayload = BaseJobPayload> {
  queueName: string;
  jobName: string;
  payload: T;
  deduplicationKey?: string;
  maxRetries?: number;
  backoffDelayMs?: number;
}

export interface JobResult<R = unknown> {
  success: boolean;
  data?: R;
  error?: string;
}
