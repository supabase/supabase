import payload from 'payload'

// Use a minimal config for migrations to avoid importing the full app graph during build
import payloadConfig from '../src/payload.migrate.config.ts'

async function run() {
  try {
    await payload.init({ config: payloadConfig })

    // Ensure non-interactive: remove any dev-mode migration sentinel rows
    try {
      await payload.delete({
        collection: 'payload-migrations',
        where: { batch: { equals: -1 } },
      })
    } catch {}

    await payload.db.migrate()
    // eslint-disable-next-line no-console
    console.log('✅ Payload migrations complete')
    process.exit(0)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('❌ Payload migrations failed:', err)
    process.exit(1)
  }
}

run()
