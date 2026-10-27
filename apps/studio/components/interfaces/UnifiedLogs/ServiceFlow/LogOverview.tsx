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
  MemoizedSupavisorBlock,
} from './components/ServiceBlocks'
import type { ServiceFlowBlockProps } from './types'

type LogOverviewProps = Omit<ServiceFlowBlockProps, 'data'> & {
  data: ColumnSchema
}

function RequestOverview({ children, ...props }: LogOverviewProps & { children: ReactNode }) {
  return (
    <>
      <MemoizedNetworkBlock {...props} defaultOpen />
      {children}
    </>
  )
}

function SupavisorOverview(props: LogOverviewProps) {
  return <MemoizedSupavisorBlock {...props} defaultOpen />
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
  supavisor: SupavisorOverview,
}

export const hasLogOverviewRenderer = (logType: string) => logType in LOG_OVERVIEW_RENDERERS

export function LogOverview({
  attributes,
  ...props
}: LogOverviewProps & { attributes?: ColumnSchema['metadata'] }) {
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
