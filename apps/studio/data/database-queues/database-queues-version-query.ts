import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { ResponseError } from 'types'
import { PGMQ_EXTENSION_NAME, SUPPORTED_PGMQ_VERSIONS, SupportedPgmqVersion } from './constants'

export type DatabaseQueuesVersionVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type DatabaseQueueVersionData = SupportedPgmqVersion | null
export type DatabaseQueueVersionError = ResponseError

export const useDatabaseQueuesVersionQuery = (
  { projectRef, connectionString }: DatabaseQueuesVersionVariables,
  { enabled = true }: { enabled?: boolean } = {}
) => {
  return useDatabaseExtensionsQuery<DatabaseQueueVersionData>(
    { projectRef, connectionString },
    {
      enabled,
      select: (extensions) => {
        const pgmqExtension = extensions.find((ext) => ext.name === PGMQ_EXTENSION_NAME)

        if (!pgmqExtension?.installed_version) return null

        const version = pgmqExtension.installed_version
        if (!SUPPORTED_PGMQ_VERSIONS.includes(version as any)) return null

        return version as SupportedPgmqVersion
      },
    }
  )
}
