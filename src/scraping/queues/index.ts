import { Queue, Worker, type Job } from 'bullmq';
import type { Logger } from 'pino';
import type { RawListingData } from '../types.js';

/** Queue names used throughout the scraping pipeline. */
export const QUEUE_NAMES = {
  SCRAPE_BROKER: 'scrape-broker',
  PROCESS_LISTING: 'process-listing',
  GENERATE_EMBEDDING: 'generate-embedding',
  ANALYZE_IMAGE: 'analyze-image',
} as const;

/** Job data for the scrape-broker queue. */
export interface ScrapeBrokerJob {
  brokerId: string;
  brokerName: string;
}

/** Job data for the process-listing queue. */
export interface ProcessListingJob {
  raw: RawListingData;
}

/** Job data for the generate-embedding queue. */
export interface GenerateEmbeddingJob {
  listingId: string;
  text: string;
}

/** Job data for the analyze-image queue. */
export interface AnalyzeImageJob {
  listingId: string;
  imageUrl: string;
  imageOrder: number;
}

/** Redis connection options for BullMQ. */
export interface QueueConnectionOptions {
  host: string;
  port: number;
  password?: string;
  /** Key prefix — BullMQ adds 'bull:' automatically. */
  prefix?: string;
}

/**
 * Creates all scraping pipeline queues.
 * Returns queue instances for adding jobs.
 */
export function createQueues(connection: QueueConnectionOptions) {
  const scrapeBroker = new Queue<ScrapeBrokerJob>(QUEUE_NAMES.SCRAPE_BROKER, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
    },
  });

  const processListing = new Queue<ProcessListingJob>(QUEUE_NAMES.PROCESS_LISTING, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 500 },
      attempts: 2,
      backoff: { type: 'fixed', delay: 2_000 },
    },
  });

  const generateEmbedding = new Queue<GenerateEmbeddingJob>(QUEUE_NAMES.GENERATE_EMBEDDING, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 200 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
    },
  });

  const analyzeImage = new Queue<AnalyzeImageJob>(QUEUE_NAMES.ANALYZE_IMAGE, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
      attempts: 2,
      backoff: { type: 'exponential', delay: 15_000 },
    },
  });

  return {
    scrapeBroker,
    processListing,
    generateEmbedding,
    analyzeImage,
    /** Closes all queue connections gracefully. */
    async closeAll(): Promise<void> {
      await Promise.all([
        scrapeBroker.close(),
        processListing.close(),
        generateEmbedding.close(),
        analyzeImage.close(),
      ]);
    },
  };
}

/** Type of the queues object returned by createQueues. */
export type ScrapingQueues = ReturnType<typeof createQueues>;

/**
 * Creates a BullMQ worker for a specific queue.
 * Utility wrapper that provides logging and graceful shutdown.
 */
export function createWorker<T>(
  queueName: string,
  processor: (job: Job<T>) => Promise<void>,
  connection: QueueConnectionOptions,
  log: Logger,
  concurrency = 1,
): Worker<T> {
  const worker = new Worker<T>(queueName, processor, {
    connection,
    concurrency,
  });

  worker.on('completed', (job: Job<T>) => {
    log.debug({ jobId: job.id, queue: queueName }, 'Job completed');
  });

  worker.on('failed', (job: Job<T> | undefined, err: Error) => {
    log.error({ jobId: job?.id, queue: queueName, err }, 'Job failed');
  });

  worker.on('error', (err: Error) => {
    log.error({ queue: queueName, err }, 'Worker error');
  });

  return worker;
}
