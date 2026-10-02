import { getConfig } from '../../config'
import { logger } from '../monitoring'
import { PostgresPubSub } from '../pubsub'

const { isMultitenant, databaseURL, multitenantDatabaseUrl } = getConfig()

const connectionString = isMultitenant ? (multitenantDatabaseUrl as string) : databaseURL
export const PubSub = new PostgresPubSub(connectionString)

PubSub.on('error', (err) => {
  logger.error(
    {
      type: 'pubsub',
      error: err,
    },
    'PubSub error'
  )
})
