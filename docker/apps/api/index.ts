import fastify from 'fastify'
import { config } from './config/config'
import plugins from './config/plugins'

// Global Fastify instance
const server = fastify()

// Server handler
const main = async () => {
  try {
    // Load plugins
    await plugins(server, config)

    // Wait for plugin initialization
    await server.ready()

    // Start server
    const address = await server.listen(process.env.PORT!)

    // Success
    console.log(`Server listening at ${address}`)
  } catch (err) {
    // Handle error
    console.error(err)

    // Exit
    process.exit(1)
  }
}

// Start the server
main()
