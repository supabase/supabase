import { Clock } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import { LogFields } from '../components/LogFields'
import type { ColumnSchema } from '../UnifiedLogs.schema'
import { getRowTimestampMs } from '../UnifiedLogs.utils'
import { PostgresFlowDetail } from './components/PostgresFlowDetail'
import {
  MemoizedEdgeFunctionBlock,
  MemoizedGoTrueBlock,
  MemoizedNetworkBlock,
  MemoizedPostgresBlock,
  MemoizedPostgRESTBlock,
  MemoizedStorageBlock,
} from './components/ServiceBlocks'
import type { ServiceFlowBlockProps } from './types'
import { DetailSectionHeader } from '@/components/ui/DataTable/DetailSectionHeader'

type LogOverviewProps = Omit<ServiceFlowBlockProps, 'data'> & {
  data: ColumnSchema
  rawData: unknown
}

function RequestOverview({ children, ...props }: LogOverviewProps & { children: ReactNode }) {
  const timestamp = getRowTimestampMs(props.data)
  return (
    <>
      <DetailSectionHeader
        title="Request started"
        className="border-b"
        icon={Clock}
        summary={timestamp === null ? undefined : new Date(timestamp).toLocaleString()}
      />
      <MemoizedNetworkBlock {...props} />
      {children}
    </>
  )
}

function PostgrestOverview(props: LogOverviewProps) {
  return (
    <RequestOverview {...props}>
      <MemoizedPostgRESTBlock {...props} />
      <MemoizedPostgresBlock {...props} />
    </RequestOverview>
  )
}

function AuthOverview(props: LogOverviewProps) {
  return (
    <RequestOverview {...props}>
      <MemoizedGoTrueBlock {...props} />
    </RequestOverview>
  )
}

function StorageOverview(props: LogOverviewProps) {
  return (
    <RequestOverview {...props}>
      <MemoizedStorageBlock {...props} />
    </RequestOverview>
  )
}

function EdgeFunctionOverview(props: LogOverviewProps) {
  return (
    <RequestOverview {...props}>
      <MemoizedEdgeFunctionBlock {...props} />
    </RequestOverview>
  )
}

// Renderers own the entire overview layout, independently of inspection-query support.
const LOG_OVERVIEW_RENDERERS: Partial<
  Record<ColumnSchema['log_type'], ComponentType<LogOverviewProps>>
> = {
  postgres: PostgresFlowDetail,
  postgrest: PostgrestOverview,
  auth: AuthOverview,
  storage: StorageOverview,
  'edge function': EdgeFunctionOverview,
}

export function LogOverview(props: LogOverviewProps) {
  const Renderer = LOG_OVERVIEW_RENDERERS[props.data.log_type]
  if (Renderer) return <Renderer {...props} />

  return <LogFields data={props.rawData} table={props.table} filterFields={props.filterFields} />
}
