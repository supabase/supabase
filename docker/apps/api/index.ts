import fastify from 'fastify'
import { config } from './config/config'
import plugins from './config/plugins'

// Global Fastify instance
const server = fastify({
  // In production we want INFO level logs while in dev mode we want TRACE level
  logger: process.env.NODE_ENV === 'production' ? true : { level: 'trace' }
})

// Server handler
const main = async () => {
  // Exit on unhandledRejection
  process.on('unhandledRejection', (err) => {
    console.error(err)
    process.exitCode = 1
  })

  try {
    // Load plugins
    await plugins(server, config)

    // Wait for plugin initialization
    await server.ready()

    // Start server
    await server.listen(process.env.PORT!, process.env.HOST!)

    for (const signal of ['SIGINT', 'SIGTERM']) {
      // Double signals exits the app.
      process.once(signal, () => {
        server.log.info({ signal }, 'closing application')

        server
          .close()
          .then(() => {
            server.log.info({ signal }, 'application closed')
            process.exitCode = 0
          })
          .catch((err) => {
            server.log.error({ err }, 'error closing the application')
            process.exitCode = 1
          })
      })
    }
  } catch (err) {
    // Handle error
    console.error(err)

    // Exit
    process.exitCode = 1
  }
}

// Start the server
main()
