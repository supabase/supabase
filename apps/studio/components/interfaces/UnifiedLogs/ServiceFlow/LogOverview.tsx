import type { ComponentType, ReactNode } from 'react'

import type { ColumnSchema } from '../UnifiedLogs.schema'
import { GenericLogOverview } from './components/GenericLogOverview'
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

type LogOverviewProps = Omit<ServiceFlowBlockProps, 'data'> & {
  data: ColumnSchema
  rawData: unknown
}

function RequestOverview({ children, ...props }: LogOverviewProps & { children: ReactNode }) {
  return (
    <>
      {/* Only the first section starts open; the rest are a click away */}
      <MemoizedNetworkBlock {...props} defaultOpen />
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

export const hasLogOverviewRenderer = (logType: string) => logType in LOG_OVERVIEW_RENDERERS

/**
 * Everything known about a log, grouped into collapsible sections.
 * Sources without a hand-written layout group their `attributes` generically.
 */
export function LogOverview({
  attributes,
  ...props
}: LogOverviewProps & { attributes?: Record<string, unknown> | null }) {
  const Renderer = LOG_OVERVIEW_RENDERERS[props.data.log_type]

  return (
    <>
      {Renderer ? (
        <Renderer {...props} />
      ) : (
        <GenericLogOverview
          data={props.data}
          attributes={attributes}
          filterFields={props.filterFields}
          table={props.table}
        />
      )}
    </>
  )
}
