import useProjectUsageStats from 'hooks/analytics/useProjectUsageStats'
import { LogsTableName } from '../Settings/Logs/Logs.constants'

type ServiceKey = 'db' | 'functions' | 'auth' | 'storage' | 'realtime'
type ServiceStatsMap = Record<
  ServiceKey,
  {
    current: ReturnType<typeof useProjectUsageStats>
    previous: ReturnType<typeof useProjectUsageStats>
  }
>

export const useServiceStats = (
  projectRef: string,
  timestampStart: string,
  timestampEnd: string,
  previousStart: string,
  previousEnd: string
): ServiceStatsMap => {
  const dbCurrent = useProjectUsageStats({
    projectRef,
    table: LogsTableName.POSTGRES,
    timestampStart,
    timestampEnd,
  })
  const dbPrevious = useProjectUsageStats({
    projectRef,
    table: LogsTableName.POSTGRES,
    timestampStart: previousStart,
    timestampEnd: previousEnd,
  })

  const fnCurrent = useProjectUsageStats({
    projectRef,
    table: LogsTableName.FN_EDGE,
    timestampStart,
    timestampEnd,
  })
  const fnPrevious = useProjectUsageStats({
    projectRef,
    table: LogsTableName.FN_EDGE,
    timestampStart: previousStart,
    timestampEnd: previousEnd,
  })

  const authCurrent = useProjectUsageStats({
    projectRef,
    table: LogsTableName.AUTH,
    timestampStart,
    timestampEnd,
  })
  const authPrevious = useProjectUsageStats({
    projectRef,
    table: LogsTableName.AUTH,
    timestampStart: previousStart,
    timestampEnd: previousEnd,
  })

  const storageCurrent = useProjectUsageStats({
    projectRef,
    table: LogsTableName.STORAGE,
    timestampStart,
    timestampEnd,
  })
  const storagePrevious = useProjectUsageStats({
    projectRef,
    table: LogsTableName.STORAGE,
    timestampStart: previousStart,
    timestampEnd: previousEnd,
  })

  const realtimeCurrent = useProjectUsageStats({
    projectRef,
    table: LogsTableName.REALTIME,
    timestampStart,
    timestampEnd,
  })
  const realtimePrevious = useProjectUsageStats({
    projectRef,
    table: LogsTableName.REALTIME,
    timestampStart: previousStart,
    timestampEnd: previousEnd,
  })

  return {
    db: { current: dbCurrent, previous: dbPrevious },
    functions: { current: fnCurrent, previous: fnPrevious },
    auth: { current: authCurrent, previous: authPrevious },
    storage: { current: storageCurrent, previous: storagePrevious },
    realtime: { current: realtimeCurrent, previous: realtimePrevious },
  }
}
