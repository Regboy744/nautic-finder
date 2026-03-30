/**
 * BullMQ notification queues for async alert processing.
 */

import { Queue } from 'bullmq';
import type { AlertMatch } from './alert-matcher.js';

export const NOTIFICATION_QUEUE_NAMES = {
  MATCH_ALERTS: 'match-alerts',
  SEND_EMAIL: 'send-email',
  SEND_PUSH: 'send-push',
  WEEKLY_DIGEST: 'weekly-digest',
} as const;

/** Job data for matching alerts against a new listing. */
export interface MatchAlertsJob {
  listingId: string;
  isNew: boolean;
  isPriceChange: boolean;
}

/** Job data for sending an email notification. */
export interface SendEmailJob {
  to: string;
  template: 'new-listing' | 'price-drop' | 'weekly-digest';
  data: Record<string, unknown>;
  matches: AlertMatch[];
}

export interface NotificationQueueConnection {
  host: string;
  port: number;
  password?: string;
}

/**
 * Creates notification queues.
 */
export function createNotificationQueues(connection: NotificationQueueConnection) {
  const matchAlerts = new Queue<MatchAlertsJob>(NOTIFICATION_QUEUE_NAMES.MATCH_ALERTS, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 200 },
      attempts: 2,
      backoff: { type: 'fixed', delay: 5_000 },
    },
  });

  const sendEmail = new Queue<SendEmailJob>(NOTIFICATION_QUEUE_NAMES.SEND_EMAIL, {
    connection,
    defaultJobOptions: {
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 500 },
      attempts: 3,
      backoff: { type: 'exponential', delay: 10_000 },
    },
  });

  return {
    matchAlerts,
    sendEmail,
    async closeAll(): Promise<void> {
      await Promise.all([matchAlerts.close(), sendEmail.close()]);
    },
  };
}

export type NotificationQueues = ReturnType<typeof createNotificationQueues>;
