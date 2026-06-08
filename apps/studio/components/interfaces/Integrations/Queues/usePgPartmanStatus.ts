import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export function usePgPartmanStatus() {
  const { data: project } = useSelectedProjectQuery()

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const pgPartmanExtension = (extensions ?? []).find((ext) => ext.name === 'pg_partman')
  const isAvailable = pgPartmanExtension !== undefined
  const isInstalled = pgPartmanExtension?.installed_version != undefined

  return { pgPartmanExtension, isAvailable, isInstalled }
}
