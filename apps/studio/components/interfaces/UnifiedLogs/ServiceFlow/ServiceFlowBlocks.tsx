import { memo } from 'react'
import { Badge, Skeleton, cn } from 'ui'
import { Clock, Globe, Database, Server } from 'lucide-react'

interface ServiceFlowBlockProps {
  data: any
  enrichedData?: any
  isLoading?: boolean
  error?: string
  isLast?: boolean
}

interface BlockFieldConfig {
  id: string
  label: string
  getValue: (data: any, enrichedData?: any) => string | number | null | undefined
  isClickable?: boolean
  skeletonClassName?: string
  requiresEnrichedData?: boolean
}

interface BlockFieldProps {
  config: BlockFieldConfig
  data: any
  enrichedData?: any
  isLoading?: boolean
  onClick?: () => void
}

const BlockField = ({ config, data, enrichedData, isLoading, onClick }: BlockFieldProps) => {
  const value = config.getValue(data, enrichedData)
  const displayValue = value ?? 'N/A'

  const shouldShowSkeleton = config.requiresEnrichedData && isLoading && !value

  return (
    <div className="flex justify-between items-center py-1">
      <dt className="text-[13.5px] text-foreground-light">{config.label}</dt>
      <dd className="text-right">
        {shouldShowSkeleton ? (
          <Skeleton className={cn('h-4 w-24', config.skeletonClassName)} />
        ) : (
          <span
            className={`text-sm font-mono ${
              config.isClickable ? 'text-brand cursor-pointer hover:underline' : 'text-foreground'
            } ${displayValue === 'N/A' ? 'text-foreground-light' : ''}`}
            onClick={config.isClickable ? onClick : undefined}
          >
            {displayValue}
          </span>
        )}
      </dd>
    </div>
  )
}

const TimelineStep = ({
  title,
  status,
  statusText,
  children,
  completionTime,
  isLast = false,
  hasError = false,
}: {
  title: string
  status?: number | string
  statusText?: string
  children: React.ReactNode
  completionTime?: string
  isLast?: boolean
  hasError?: boolean
}) => (
  <>
    <div className="relative">
      {/* Timeline dot - positioned on the left timeline line */}
      <div className="py-1 bg-surface-100/50 border-r border-t border-l rounded-t px-2">
        <div>
          {/* <div
            className={cn(
              'absolute left-1 top-3 w-3 h-3 rounded-full border bg-background',
              hasError ? 'border-destructive' : status ? 'border-brand' : 'border-border'
            )}
          >
            <div
              className={cn(
                'w-1.5 h-1.5 rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2',
                hasError ? 'bg-destructive' : status ? 'bg-brand' : 'bg-border'
              )}
            />
          </div> */}
          <div className="flex flex-row justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-surface-300 rounded p-0.5 border justify-center border-foreground-muted">
                {title === 'Request started' && (
                  <Clock className="w-4 h-4 text-foreground-lighter" strokeWidth={1} />
                )}
                {title === 'Network' && (
                  <Globe className="w-4 h-4 text-foreground-lighter" strokeWidth={1} />
                )}
                {title === 'PostgREST' && (
                  <Server className="w-4 h-4 text-foreground-lighter" strokeWidth={1} />
                )}
                {title === 'Postgres' && (
                  <Database className="w-4 h-4 text-foreground-lighter" strokeWidth={1} />
                )}
                {title === 'Response' && (
                  <Clock className="w-4 h-4 text-foreground-lighter" strokeWidth={1} />
                )}
              </div>
              <h3 className="text-sm text-foreground tracking-wide">{title}</h3>
            </div>

            {statusText && (
              <span className="text-xs text-foreground-light tracking-wide">{statusText}</span>
            )}

            {status && (
              <span
                className={cn(
                  'font-mono px-2 py-0.5 text-xs rounded',
                  hasError
                    ? 'text-destructive bg-destructive/10 border border-destructive/20'
                    : 'text-brand bg-brand/10 border border-brand/20'
                )}
              >
                {status}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main section box */}
      <div className={cn(' border rounded-b', hasError ? 'border-destructive' : 'border-border')}>
        {/* Content */}
        <dl className="space-y-0 divide-y px-3 py-2 bg-surface-100/50">{children}</dl>
        {/* Timeline connector and completion time - only if not last */}
        {/* {!isLast && (
          <div className="px-3 border-t py-0.5">
            {completionTime && (
              <div className="text-[12px] font-mono text-foreground-light">
                Completed in {completionTime}
              </div>
            )}
          </div>
        )} */}
      </div>
      {!isLast && <div className="border-l h-3 ml-5"></div>}
    </div>
  </>
)

// Field configurations - simplified to match the design
const originFields: BlockFieldConfig[] = [
  {
    id: 'time',
    label: 'Time',
    getValue: (data) => {
      if (!data?.timestamp && !data?.date) return null
      try {
        const timestamp = data?.timestamp || data?.date
        return new Date(timestamp).toLocaleString()
      } catch {
        return 'Invalid date'
      }
    },
  },
]

const networkFields: BlockFieldConfig[] = [
  {
    id: 'user_agent',
    label: 'User Agent',
    getValue: (data, enrichedData) => {
      const ua = enrichedData?.user_agent || data?.user_agent
      return ua ? `v${ua.split('/')[1]?.split(' ')[0] || ua}` : 'v2.45'
    },
    requiresEnrichedData: true,
  },
  {
    id: 'library',
    label: 'Library',
    getValue: (data, enrichedData) => {
      const ua = enrichedData?.user_agent || data?.user_agent
      if (ua?.includes('supabase-js')) return 'supabase-js v2.45'
      return 'supabase-js v2.45'
    },
    requiresEnrichedData: true,
  },
  {
    id: 'authorization',
    label: 'Authorization',
    getValue: (data) =>
      data?.api_role === 'anon' ? 'PUBLIC API KEY' : data?.api_role || 'PUBLIC API KEY',
  },
]

const postgrestFields: BlockFieldConfig[] = [
  {
    id: 'message',
    label: 'Message',
    getValue: (data, enrichedData) => enrichedData?.message || 'N/A',
    requiresEnrichedData: true,
  },
]

const postgresFields: BlockFieldConfig[] = [
  {
    id: 'run_statement',
    label: 'Run statement',
    getValue: (data, enrichedData) =>
      enrichedData?.statement_count ? `${enrichedData.statement_count} spans` : '60 spans',
    requiresEnrichedData: true,
  },
  {
    id: 'execution_time',
    label: 'Execution time',
    getValue: (data, enrichedData) => {
      const time = enrichedData?.execution_time || enrichedData?.query_duration
      return time ? `${time}s` : '0.4s'
    },
    requiresEnrichedData: true,
  },
  {
    id: 'postgres_version',
    label: 'Postgres version',
    getValue: (data, enrichedData) => enrichedData?.postgres_version || '16.2.1',
    requiresEnrichedData: true,
  },
  {
    id: 'environment',
    label: 'Environment',
    getValue: () => 'Production',
  },
  {
    id: 'region',
    label: 'Region',
    getValue: (data, enrichedData) => enrichedData?.region || 'us-west-1',
    requiresEnrichedData: true,
  },
  {
    id: 'memory_used',
    label: 'Estimated memory used',
    getValue: (data, enrichedData) => enrichedData?.memory_used || 'N/A',
    requiresEnrichedData: true,
  },
]

// Request Started
export const OriginBlock = memo(({ data, enrichedData, isLoading }: ServiceFlowBlockProps) => {
  return (
    <TimelineStep title="Request started" completionTime="2ms">
      {originFields.map((field) => (
        <BlockField
          key={field.id}
          config={field}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
        />
      ))}
    </TimelineStep>
  )
})

// Network/Cloudflare
export const NetworkBlock = memo(({ data, enrichedData, isLoading }: ServiceFlowBlockProps) => {
  return (
    <TimelineStep title="Network" statusText="CLOUDFLARE" completionTime="2ms">
      {networkFields.map((field) => (
        <BlockField
          key={field.id}
          config={field}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
        />
      ))}
    </TimelineStep>
  )
})

// PostgREST
export const PostgRESTBlock = memo(({ data, enrichedData, isLoading }: ServiceFlowBlockProps) => {
  const hasError = data?.status && Number(data.status) >= 400

  return (
    <TimelineStep title="PostgREST" status={data?.status} completionTime="2ms" hasError={hasError}>
      {postgrestFields.map((field) => (
        <BlockField
          key={field.id}
          config={field}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
        />
      ))}

      {hasError && (
        <>
          <div className="flex justify-between items-center py-1">
            <dt className="text-xs text-foreground-light uppercase tracking-wide">Error Code</dt>
            <dd className="text-right">
              <span className="text-sm font-mono text-foreground">POSTGREST 54*</span>
            </dd>
          </div>
          <div className="flex justify-between items-center py-1">
            <dt className="text-xs text-foreground-light uppercase tracking-wide">Error Message</dt>
            <dd className="text-right">
              <span className="text-sm font-mono text-foreground">"too complex"</span>
            </dd>
          </div>
          <div className="flex justify-between items-center py-1">
            <dt className="text-xs text-foreground-light uppercase tracking-wide">Details</dt>
            <dd className="text-right">
              <span className="text-sm font-mono text-foreground-light">N/A</span>
            </dd>
          </div>
          <div className="flex justify-between items-center py-1">
            <dt className="text-xs text-foreground-light uppercase tracking-wide">Hint</dt>
            <dd className="text-right">
              <span className="text-sm font-mono text-foreground-light">N/A</span>
            </dd>
          </div>
        </>
      )}
    </TimelineStep>
  )
})

// Postgres
export const PostgresBlock = memo(
  ({ data, enrichedData, isLoading, isLast = true }: ServiceFlowBlockProps) => {
    const hasError = data?.status && Number(data.status) >= 400
    const isSkipped = hasError

    return (
      <TimelineStep
        title="Postgres"
        status={isSkipped ? undefined : data?.status || 200}
        statusText={isSkipped ? 'SKIPPED' : undefined}
        completionTime={isSkipped ? undefined : '2ms'}
        isLast={isLast}
        hasError={false}
      >
        {!isSkipped &&
          postgresFields.map((field) => (
            <BlockField
              key={field.id}
              config={field}
              data={data}
              enrichedData={enrichedData}
              isLoading={isLoading}
            />
          ))}

        {isSkipped && (
          <div className="text-sm text-foreground-light italic">Skipped due to PostgREST error</div>
        )}
      </TimelineStep>
    )
  }
)

// Response (final step)
export const ResponseBlock = memo(({ data }: { data: any }) => {
  const hasError = data?.status && Number(data.status) >= 400

  return (
    <TimelineStep title="Response" status={data?.status} isLast={true} hasError={hasError}>
      <div className="text-sm text-foreground-light">
        {hasError ? 'Error response sent to client' : 'Response sent to client'}
      </div>
    </TimelineStep>
  )
})

// Memoized exports
export const MemoizedOriginBlock = memo(OriginBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading
  )
}) as typeof OriginBlock

export const MemoizedNetworkBlock = memo(NetworkBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading
  )
}) as typeof NetworkBlock

export const MemoizedPostgRESTBlock = memo(PostgRESTBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading
  )
}) as typeof PostgRESTBlock

export const MemoizedPostgresBlock = memo(PostgresBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading
  )
}) as typeof PostgresBlock

export const MemoizedResponseBlock = memo(ResponseBlock, (prev, next) => {
  return prev.data === next.data
}) as typeof ResponseBlock
