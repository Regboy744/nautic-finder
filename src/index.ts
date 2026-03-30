import { loadConfig } from './config/env.js';
import { createServer } from './server.js';

/**
 * Application entry point.
 * Loads config, creates server, starts listening.
 */
async function main(): Promise<void> {
  // Load and validate environment variables
  const config = loadConfig();

  // Create the Fastify server
  const server = await createServer({ config });

  try {
    // Start listening
    await server.listen({
      port: config.app.port,
      host: '0.0.0.0',
    });

    server.log.info(
      { port: config.app.port, env: config.app.nodeEnv },
      'NauticFinder API started',
    );
  } catch (error) {
    server.log.fatal(error, 'Failed to start server');
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  // eslint-disable-next-line no-console
  console.error('Uncaught exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

void main();
