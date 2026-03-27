'use client'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { useParams } from 'next/navigation'

export default function ObsLogsRealtimePage() {
  const params = useParams()
  const projectRef = params?.projectRef as string | undefined

  if (!projectRef) return null

  return (
    <LogsPreviewer
      condensedLayout
      queryType="realtime"
      projectRef={projectRef}
      tableName={LogsTableName.REALTIME}
    />
  )
}
