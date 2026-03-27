'use client'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { useParams, useSearchParams } from 'next/navigation'

export default function ObsLogsApiPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const projectRef = params?.projectRef as string | undefined
  const identifier = searchParams?.get('db') ?? undefined

  if (!projectRef) return null

  return (
    <LogsPreviewer
      condensedLayout
      queryType="api"
      projectRef={projectRef}
      tableName={LogsTableName.EDGE}
      filterOverride={identifier ? { identifier } : undefined}
    />
  )
}
