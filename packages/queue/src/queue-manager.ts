import { Queue, Worker, type JobsOptions, type Processor } from "bullmq";
import type { Redis } from "ioredis";
import type { JobDefinition, BaseJobPayload } from "./job-base.js";

export class QueueManager {
  private readonly redis: Redis;
  private readonly queues = new Map<string, Queue>();
  private readonly workers = new Map<string, Worker>();

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Get or initialize a BullMQ queue.
   */
  getQueue(queueName: string): Queue {
    let queue = this.queues.get(queueName);
    if (!queue) {
      queue = new Queue(queueName, {
        connection: this.redis as unknown as never,
        skipVersionCheck: true,
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
          removeOnComplete: { count: 500, age: 3600 * 24 },
          removeOnFail: { count: 1000, age: 3600 * 24 * 7 },
        },
      });
      this.queues.set(queueName, queue);
    }
    return queue;
  }

  /**
   * Enqueue a job with optional deduplication.
   */
  async enqueue<T extends BaseJobPayload>(definition: JobDefinition<T>): Promise<string | undefined> {
    const queue = this.getQueue(definition.queueName);

    const jobOptions: JobsOptions = {
      attempts: definition.maxRetries ?? 3,
    };

    if (definition.deduplicationKey) {
      jobOptions.jobId = definition.deduplicationKey;
    }

    if (definition.backoffDelayMs) {
      jobOptions.backoff = {
        type: "exponential",
        delay: definition.backoffDelayMs,
      };
    }

    const job = await queue.add(definition.jobName, definition.payload, jobOptions);
    return job.id;
  }

  /**
   * Register a worker processor for a queue.
   */
  registerWorker<T extends BaseJobPayload>(
    queueName: string,
    processor: Processor<T>,
    concurrency = 5,
  ): Worker<T> {
    const worker = new Worker<T>(queueName, processor, {
      connection: this.redis as unknown as never,
      concurrency,
      skipVersionCheck: true,
    });
    this.workers.set(queueName, worker as unknown as Worker);
    return worker;
  }

  /**
   * Graceful shutdown of all queues and workers.
   */
  async closeAll(): Promise<void> {
    for (const worker of this.workers.values()) {
      await worker.close();
    }
    for (const queue of this.queues.values()) {
      await queue.close();
    }
  }
}
