import { BracesIcon } from 'lucide-react'
import type { ComponentType, ReactNode } from 'react'

import type { ColumnSchema } from '../UnifiedLogs.schema'
import { GenericLogOverview, LogAttributes } from './components/GenericLogOverview'
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
import { CollapsibleDetailSection } from '@/components/ui/DataTable/CollapsibleDetailSection'

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
  header,
  attributes,
  onAddAttributeFilter,
  ...props
}: LogOverviewProps & {
  header?: ReactNode
  attributes?: ColumnSchema['metadata']
  onAddAttributeFilter?: (key: string, value: string) => void
}) {
  const Renderer = LOG_OVERVIEW_RENDERERS[props.data.log_type]

  return (
    <>
      {header}
      {Renderer ? (
        <>
          <Renderer {...props} />
          {attributes && Object.keys(attributes).length > 0 && (
            <CollapsibleDetailSection title="Attributes" icon={BracesIcon} className="border-b">
              <LogAttributes attributes={attributes} onAddFilter={onAddAttributeFilter} />
            </CollapsibleDetailSection>
          )}
        </>
      ) : (
        <GenericLogOverview
          data={props.data}
          attributes={attributes}
          onAddAttributeFilter={onAddAttributeFilter}
          filterFields={props.filterFields}
          table={props.table}
        />
      )}
    </>
  )
}
