/**
 * Email sender — sends notification emails via Resend.
 */

import { Resend } from 'resend';
import type { Logger } from 'pino';
import { ExternalServiceError } from '../../shared/errors/index.js';

export interface EmailSenderConfig {
  apiKey: string;
  fromAddress?: string;
}

/** Email template data for new listing alerts. */
export interface NewListingEmailData {
  userName: string;
  alertName: string;
  listings: Array<{
    title: string;
    price: string;
    url: string;
    location: string;
  }>;
}

/** Email template data for price drop alerts. */
export interface PriceDropEmailData {
  userName: string;
  listingTitle: string;
  oldPrice: string;
  newPrice: string;
  currency: string;
  listingUrl: string;
}

/**
 * Creates an email sender backed by Resend.
 */
export function createEmailSender(config: EmailSenderConfig, log: Logger) {
  const resend = new Resend(config.apiKey);
  const from = config.fromAddress ?? 'NauticFinder <alerts@nauticfinder.ai>';

  return {
    /** Sends a new listing alert email. */
    async sendNewListingAlert(to: string, data: NewListingEmailData): Promise<void> {
      const listingHtml = data.listings
        .map(
          (l) =>
            `<li><strong>${l.title}</strong> — ${l.price}<br/>${l.location}<br/><a href="${l.url}">View listing</a></li>`,
        )
        .join('');

      try {
        await resend.emails.send({
          from,
          to,
          subject: `New boats matching "${data.alertName}"`,
          html: `
            <h2>Hi ${data.userName},</h2>
            <p>New boats matching your alert "<strong>${data.alertName}</strong>":</p>
            <ul>${listingHtml}</ul>
            <p><small>You're receiving this because you set up a search alert on NauticFinder.</small></p>
          `,
        });

        log.info(
          { to, alertName: data.alertName, count: data.listings.length },
          'New listing alert email sent',
        );
      } catch (err) {
        log.error({ err, to }, 'Failed to send new listing alert email');
        throw new ExternalServiceError('resend', 'Email send failed', err);
      }
    },

    /** Sends a price drop alert email. */
    async sendPriceDropAlert(to: string, data: PriceDropEmailData): Promise<void> {
      try {
        await resend.emails.send({
          from,
          to,
          subject: `Price drop: ${data.listingTitle}`,
          html: `
            <h2>Price Drop Alert</h2>
            <p><strong>${data.listingTitle}</strong></p>
            <p>Price dropped from <s>${data.currency} ${data.oldPrice}</s> to <strong>${data.currency} ${data.newPrice}</strong></p>
            <p><a href="${data.listingUrl}">View listing</a></p>
            <p><small>You're receiving this because you saved this boat on NauticFinder.</small></p>
          `,
        });

        log.info({ to, listing: data.listingTitle }, 'Price drop alert email sent');
      } catch (err) {
        log.error({ err, to }, 'Failed to send price drop alert email');
        throw new ExternalServiceError('resend', 'Email send failed', err);
      }
    },
  };
}

export type EmailSender = ReturnType<typeof createEmailSender>;
