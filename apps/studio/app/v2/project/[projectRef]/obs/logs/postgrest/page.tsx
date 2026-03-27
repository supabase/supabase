'use client'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsTableEmptyState } from '@/components/interfaces/Settings/Logs/LogsTableEmptyState'
import { useParams, useSearchParams } from 'next/navigation'

export default function ObsLogsPostgrestPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectRef = params?.projectRef as string | undefined
  const identifier = searchParams?.get('db') ?? undefined

  if (!projectRef) return null

  return (
    <LogsPreviewer
      condensedLayout
      queryType="postgrest"
      projectRef={projectRef}
      tableName={LogsTableName.POSTGREST}
      EmptyState={
        <LogsTableEmptyState
          title="No results found"
          description="Only errors are captured into PostgREST logs by default. Check the API Gateway logs for HTTP requests."
        />
      }
      filterOverride={identifier ? { identifier } : undefined}
    />
  )
}
