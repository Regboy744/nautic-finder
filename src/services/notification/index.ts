import type { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { createServiceLogger } from '../../shared/logger/index.js';
import { createEmailSender } from './email-sender.js';
import { createNotificationService } from './service.js';
import notificationRoutes from './routes.js';

export interface NotificationPluginOptions {
  db: import('../../shared/db/client.js').Database['db'];
  resendApiKey: string;
  redisUrl?: string;
  fromAddress?: string;
}

function parseRedisUrl(redisUrl: string): { host: string; port: number; password?: string } | null {
  try {
    const parsed = new URL(redisUrl);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : 6379,
      password: parsed.password || undefined,
    };
  } catch {
    return null;
  }
}

async function notificationPlugin(
  server: FastifyInstance,
  opts: NotificationPluginOptions,
): Promise<void> {
  const log = createServiceLogger('notification');

  const emailSender = createEmailSender(
    { apiKey: opts.resendApiKey, fromAddress: opts.fromAddress },
    log,
  );

  const queueConnection = opts.redisUrl ? parseRedisUrl(opts.redisUrl) : null;

  const notificationService = createNotificationService({
    db: opts.db,
    emailSender,
    queueConnection,
    log,
  });

  notificationService.startWorkers();

  await server.register(notificationRoutes, { notificationService });

  server.addHook('onClose', async () => {
    await notificationService.stopWorkers();
  });

  log.info('Notification service registered');
}

export default fp(notificationPlugin, {
  name: 'notification',
  fastify: '5.x',
});
