'use client'

import { IS_PLATFORM } from 'common'
import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { useParams } from 'next/navigation'

export default function ObsLogsDedicatedPoolerPage() {
  const params = useParams()
  const projectRef = params?.projectRef as string | undefined

  if (!IS_PLATFORM || !projectRef) return null

  return (
    <LogsPreviewer
      condensedLayout
      queryType="pgbouncer"
      projectRef={projectRef}
      tableName={LogsTableName.PGBOUNCER}
    />
  )
}
