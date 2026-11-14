import { PGMQ_EXTENSION_NAME } from './constants'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import type { StudioError } from '@/lib/errors/studio-errors'

export type DatabaseQueuesVersionVariables = {
  projectRef?: string
  connectionString?: string | null
}

export type DatabaseQueueVersionData = string | null
export type DatabaseQueueVersionError = StudioError

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

        return pgmqExtension.installed_version
      },
    }
  )
}
