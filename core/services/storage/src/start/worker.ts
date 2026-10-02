import { AsyncAbortController } from '@internal/concurrency'
import { listenForTenantUpdate, PubSub } from '@internal/database'
import { logger, logSchema, setLogger } from '@internal/monitoring'
import { Queue } from '@internal/queue'
import { registerWorkers } from '@storage/events'
import { LogController } from 'fastify'
import adminApp from '../admin-app'
import { getConfig } from '../config'
import { bindShutdownSignals, createServerClosedPromise, shutdown } from './shutdown'

const workerLogger = logger.child({ service: 'worker' })
setLogger(workerLogger)

const shutdownSignal = new AsyncAbortController()

bindShutdownSignals(shutdownSignal)

// Start the Worker
main()
  .then(async () => {
    logSchema.info(logger, '[Server] Started successfully', {
      type: 'worker',
    })
  })
  .catch(async (e) => {
    logSchema.error(logger, '[Queue Server] Error starting server', {
      type: 'worker',
      error: e,
    })
    await shutdown(shutdownSignal)
    process.exit(1)
  })
  .catch(() => {
    process.exit(1)
  })

/**
 * Starts Storage Worker
 */
export async function main() {
  const { requestTraceHeader, adminPort, host } = getConfig()

  logger.info('[Queue] Starting Queue Worker')

  await listenForTenantUpdate(PubSub)

  await Promise.all([
    Queue.start({
      signal: shutdownSignal.signal,
      registerWorkers,
      onMessage: (job) =>
        logger.info(
          {
            type: 'worker',
            job: JSON.stringify(job),
          },
          `[Worker] Job Received ${job.name} ${job.id}`
        ),
    }),
    PubSub.start({
      signal: shutdownSignal.nextGroup.nextGroup.signal,
    }),
  ])

  const server = adminApp({
    loggerInstance: logger,
    logController: new LogController({ disableRequestLogging: true }),
    childLoggerFactory(logger) {
      return logger
    },
    requestIdHeader: requestTraceHeader,
  })

  const shutdownPromise = createServerClosedPromise(server.server, () => {
    logSchema.info(logger, '[Admin Server] Exited', {
      type: 'server',
    })
  })

  shutdownSignal.nextGroup.signal.addEventListener('abort', async () => {
    logSchema.info(logger, '[Admin Server] Stopping', {
      type: 'server',
    })
    await shutdownPromise
  })

  await server.listen({ port: adminPort, host, signal: shutdownSignal.nextGroup.signal })
}
