import closeWithGrace from 'close-with-grace'
import { pino } from 'pino'
import { PostgresMeta } from '../lib/index.js'
import { build as buildApp } from './app.js'
import { build as buildAdminApp } from './admin-app.js'
import {
  DEFAULT_POOL_CONFIG,
  EXPORT_DOCS,
  GENERATE_TYPES,
  GENERATE_TYPES_DEFAULT_SCHEMA,
  GENERATE_TYPES_DETECT_ONE_TO_ONE_RELATIONSHIPS,
  GENERATE_TYPES_INCLUDED_SCHEMAS,
  GENERATE_TYPES_SWIFT_ACCESS_CONTROL,
  PG_CONNECTION,
  PG_META_HOST,
  PG_META_PORT,
  POSTGREST_VERSION,
  SHUTDOWN_GRACE_PERIOD_MS,
} from './constants.js'
import {
  generateGo,
  generatePython,
  generateSwift,
  generateTypescript,
} from '@supabase/postgrest-typegen'
import { getGeneratorMetadata } from '../lib/generators.js'
import { destroyFormatPool } from './format-pool.js'

const logger = pino({
  formatters: {
    level(label) {
      return { level: label }
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
})

const app = buildApp({ logger })
const adminApp = buildAdminApp({ logger })

async function getTypeOutput(): Promise<string | null> {
  const pgMeta: PostgresMeta = new PostgresMeta({
    ...DEFAULT_POOL_CONFIG,
    connectionString: PG_CONNECTION,
  })
  // `getGeneratorMetadata` introspects via @supabase/postgrest-typegen and ends
  // the pool. Behavior freeze: the CLI path only supports included schemas.
  const { data: generatorMetadata, error } = await getGeneratorMetadata(pgMeta, {
    includedSchemas:
      GENERATE_TYPES_INCLUDED_SCHEMAS.length > 0 ? GENERATE_TYPES_INCLUDED_SCHEMAS : undefined,
  })
  if (error) {
    throw new Error(error.message)
  }

  switch (GENERATE_TYPES?.toLowerCase()) {
    case 'typescript':
      return await generateTypescript(generatorMetadata!, {
        detectOneToOneRelationships: GENERATE_TYPES_DETECT_ONE_TO_ONE_RELATIONSHIPS,
        postgrestVersion: POSTGREST_VERSION,
        defaultSchema: GENERATE_TYPES_DEFAULT_SCHEMA,
      })
    case 'swift':
      return generateSwift(generatorMetadata!, {
        accessControl: GENERATE_TYPES_SWIFT_ACCESS_CONTROL,
      })
    case 'go':
      return generateGo(generatorMetadata!)
    case 'python':
      return generatePython(generatorMetadata!)
    default:
      throw new Error(`Unsupported language for GENERATE_TYPES: ${GENERATE_TYPES}`)
  }
}

if (EXPORT_DOCS) {
  // TODO: Move to a separate script.
  await app.ready()
  // @ts-ignore: app.swagger() is a Fastify decorator, so doesn't show up in the types
  console.log(JSON.stringify(app.swagger(), null, 2))
} else if (GENERATE_TYPES) {
  console.log(await getTypeOutput())
} else {
  closeWithGrace({ delay: SHUTDOWN_GRACE_PERIOD_MS }, async ({ err, signal, manual }) => {
    if (err) {
      app.log.error({ err }, 'server closing with error')
    } else {
      app.log.info(`${signal} signal received, server closing, close manual received: ${manual}`)
    }
    await app.close().catch((err) => app.log.error({ err }, 'Failed to close app'))
    await adminApp.close().catch((err) => app.log.error({ err }, 'Failed to close adminApp'))
    // worker threads keep the event loop alive, so the process would not exit
    await destroyFormatPool().catch((err) =>
      app.log.error({ err }, 'Failed to destroy format pool')
    )
  })

  app.listen({ port: PG_META_PORT, host: PG_META_HOST }, (err) => {
    if (err) {
      app.log.error({ err }, 'Uncaught error in app, exit(1)')
      process.exit(1)
    }
    const adminPort = PG_META_PORT + 1
    adminApp.listen({ port: adminPort, host: PG_META_HOST }, (err) => {
      if (err) {
        app.log.error({ err }, 'Uncaught error in adminApp, exit(1)')
        process.exit(1)
      }
    })
  })
}
