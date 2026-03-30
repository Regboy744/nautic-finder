import { Worker, type Job } from 'bullmq';
import type { Logger } from 'pino';
import { createListingsRepository } from '../catalog/repositories/listings.repository.js';
import { createUsersRepository } from '../user/repositories/users.repository.js';
import { createSearchAlertsRepository } from '../user/repositories/search-alerts.repository.js';
import type { Database } from '../../shared/db/client.js';
import { findMatchingAlerts } from './alert-matcher.js';
import type { EmailSender } from './email-sender.js';
import {
  createNotificationQueues,
  NOTIFICATION_QUEUE_NAMES,
  type MatchAlertsJob,
  type NotificationQueueConnection,
  type SendEmailJob,
} from './queues.js';

export interface NotificationServiceDeps {
  db: Database['db'];
  emailSender: EmailSender;
  queueConnection: NotificationQueueConnection | null;
  log: Logger;
}

/**
 * Notification service: alert matching + queued email delivery.
 */
export function createNotificationService(deps: NotificationServiceDeps) {
  const { db, emailSender, queueConnection, log } = deps;

  const listingsRepo = createListingsRepository(db);
  const usersRepo = createUsersRepository(db);
  const alertsRepo = createSearchAlertsRepository(db);

  const queues = queueConnection ? createNotificationQueues(queueConnection) : null;
  const workers: Worker[] = [];

  async function processMatchAlerts(job: Job<MatchAlertsJob>): Promise<void> {
    const { listingId, isNew, isPriceChange } = job.data;

    const listing = await listingsRepo.findById(listingId);
    if (!listing) {
      log.warn({ listingId }, 'Notification match skipped, listing not found');
      return;
    }

    const activeAlerts = await alertsRepo.findActive();
    const matches = findMatchingAlerts(listing, activeAlerts);

    if (matches.length === 0) {
      log.info({ listingId }, 'No matching alerts for listing');
      return;
    }

    for (const match of matches) {
      const user = await usersRepo.findById(match.userId);
      if (!user?.email) continue;

      if (queues) {
        const emailJob: SendEmailJob = {
          to: user.email,
          template: isPriceChange ? 'price-drop' : 'new-listing',
          data: {
            userName: user.name ?? 'there',
            alertName: match.alertName,
            listingTitle:
              listing.title ?? `${listing.make ?? ''} ${listing.modelName ?? ''}`.trim(),
            oldPrice: '',
            newPrice: listing.price ?? '',
            currency: listing.currency ?? 'EUR',
            listingUrl: listing.sourceUrl ?? '',
            listings: [
              {
                title: listing.title ?? `${listing.make ?? ''} ${listing.modelName ?? ''}`.trim(),
                price: `${listing.currency ?? 'EUR'} ${listing.price ?? 'N/A'}`,
                url: listing.sourceUrl ?? '',
                location: [listing.city, listing.region, listing.country]
                  .filter(Boolean)
                  .join(', '),
              },
            ],
          },
          matches: [match],
        };
        await queues.sendEmail.add('send-email', emailJob);
      } else {
        // No queue configured: send inline as fallback
        await sendEmailInline({
          to: user.email,
          template: isPriceChange ? 'price-drop' : 'new-listing',
          data: {
            userName: user.name ?? 'there',
            alertName: match.alertName,
            listingTitle:
              listing.title ?? `${listing.make ?? ''} ${listing.modelName ?? ''}`.trim(),
            oldPrice: '',
            newPrice: listing.price ?? '',
            currency: listing.currency ?? 'EUR',
            listingUrl: listing.sourceUrl ?? '',
            listings: [
              {
                title: listing.title ?? `${listing.make ?? ''} ${listing.modelName ?? ''}`.trim(),
                price: `${listing.currency ?? 'EUR'} ${listing.price ?? 'N/A'}`,
                url: listing.sourceUrl ?? '',
                location: [listing.city, listing.region, listing.country]
                  .filter(Boolean)
                  .join(', '),
              },
            ],
          },
          matches: [match],
        });
      }
    }

    log.info(
      { listingId, isNew, isPriceChange, matches: matches.length },
      'Processed alert matching',
    );
  }

  async function sendEmailInline(job: SendEmailJob): Promise<void> {
    if (job.template === 'new-listing') {
      await emailSender.sendNewListingAlert(
        job.to,
        job.data as unknown as Parameters<EmailSender['sendNewListingAlert']>[1],
      );
      return;
    }

    await emailSender.sendPriceDropAlert(
      job.to,
      job.data as unknown as Parameters<EmailSender['sendPriceDropAlert']>[1],
    );
  }

  async function processSendEmail(job: Job<SendEmailJob>): Promise<void> {
    await sendEmailInline(job.data);
  }

  function startWorkers(): void {
    if (!queueConnection || !queues) return;

    const matchWorker = new Worker<MatchAlertsJob>(
      NOTIFICATION_QUEUE_NAMES.MATCH_ALERTS,
      processMatchAlerts,
      { connection: queueConnection, concurrency: 2 },
    );

    const emailWorker = new Worker<SendEmailJob>(
      NOTIFICATION_QUEUE_NAMES.SEND_EMAIL,
      processSendEmail,
      { connection: queueConnection, concurrency: 3 },
    );

    matchWorker.on('failed', (job, err) => {
      log.error({ jobId: job?.id, err }, 'Match alerts job failed');
    });

    emailWorker.on('failed', (job, err) => {
      log.error({ jobId: job?.id, err }, 'Send email job failed');
    });

    workers.push(matchWorker, emailWorker);
    log.info('Notification workers started');
  }

  async function stopWorkers(): Promise<void> {
    await Promise.all(workers.map((w) => w.close()));
    workers.length = 0;

    if (queues) {
      await queues.closeAll();
    }
  }

  return {
    async enqueueListingMatch(
      listingId: string,
      isNew = true,
      isPriceChange = false,
    ): Promise<void> {
      if (queues) {
        await queues.matchAlerts.add('match-alerts', { listingId, isNew, isPriceChange });
      } else {
        await processMatchAlerts({
          data: { listingId, isNew, isPriceChange },
        } as Job<MatchAlertsJob>);
      }
    },
    startWorkers,
    stopWorkers,
  };
}

export type NotificationService = ReturnType<typeof createNotificationService>;
