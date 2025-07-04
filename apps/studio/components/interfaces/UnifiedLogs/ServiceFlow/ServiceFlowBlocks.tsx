import { Table } from '@tanstack/react-table'
import { DataTableFilterField } from 'components/ui/DataTable/DataTable.types'
import { DataTableColumnStatusCode } from 'components/ui/DataTable/DataTableColumn/DataTableColumnStatusCode'
import { DataTableSheetRowAction } from 'components/ui/DataTable/DataTableSheetRowAction'
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Clock,
  Database,
  Globe,
  Server,
  X,
  ExternalLink,
  AlertCircle,
  FileX,
} from 'lucide-react'
import { Auth, EdgeFunctions, Storage } from 'icons'
import { memo, useState } from 'react'
import { useParams } from 'common'
import { formatBytes } from 'lib/helpers'
import {
  Badge,
  Button,
  Collapsible_Shadcn_ as Collapsible,
  CollapsibleContent_Shadcn_ as CollapsibleContent,
  CollapsibleTrigger_Shadcn_ as CollapsibleTrigger,
  Skeleton,
  cn,
} from 'ui'

// Debug flag for console logs - set to true for debugging
const DEBUG_SERVICE_FLOW = false

// Helper function to determine level from HTTP status code
const getStatusLevel = (status?: number | string): string => {
  if (!status) return 'success'
  const statusNum = Number(status)
  if (statusNum >= 500) return 'error'
  if (statusNum >= 400) return 'warning'
  if (statusNum >= 300) return 'redirect'
  if (statusNum >= 200) return 'success'
  if (statusNum >= 100) return 'info'
  return 'success'
}

interface ServiceFlowBlockProps {
  data: any
  enrichedData?: any
  isLoading?: boolean
  error?: string
  isLast?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
}

interface BlockFieldConfig {
  id: string
  label: string
  getValue: (data: any, enrichedData?: any) => string | number | null | undefined
  skeletonClassName?: string
  requiresEnrichedData?: boolean
}

interface BlockFieldProps {
  config: BlockFieldConfig
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
}

const BlockField = ({
  config,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
}: BlockFieldProps) => {
  const value = config.getValue(data, enrichedData)
  const displayValue = value ?? 'N/A'
  const stringValue = String(displayValue)

  const shouldShowSkeleton = config.requiresEnrichedData && isLoading && !value

  const filterField = filterFields.find((field) => field.value === config.id)
  const isFilterable = !!filterField

  // Special handling for status field and key fields
  const isStatusField = config.id === 'status'
  const isApiKeyField = config.id === 'api_key_role'

  const fieldContent = (
    <>
      <dt className="text-[13.5px] text-foreground-light">{config.label}</dt>
      <dd className="text-right">
        {shouldShowSkeleton ? (
          <Skeleton className={cn('h-4 w-24', config.skeletonClassName)} />
        ) : isStatusField && displayValue !== 'N/A' ? (
          <DataTableColumnStatusCode
            value={displayValue}
            level={getStatusLevel(displayValue)}
            className="text-xs"
          />
        ) : isApiKeyField && displayValue !== 'N/A' ? (
          <span className="px-2 py-1 text-xs font-mono border border-border rounded bg-surface-100">
            {displayValue}
          </span>
        ) : (
          <span
            className={`text-sm font-mono ${
              isFilterable ? 'text-foreground cursor-pointer hover:underline' : 'text-foreground'
            } ${displayValue === 'N/A' ? 'text-foreground-light' : ''}`}
          >
            {displayValue}
          </span>
        )}
      </dd>
    </>
  )

  if (isFilterable && !shouldShowSkeleton && displayValue !== 'N/A') {
    return (
      <DataTableSheetRowAction
        fieldValue={config.id}
        filterFields={filterFields}
        value={stringValue}
        table={table}
        className="flex justify-between items-center py-1 px-2  rounded hover:bg-accent/50 cursor-pointer w-full hover:bg-surface-400"
      >
        {fieldContent}
      </DataTableSheetRowAction>
    )
  }

  return <div className="flex justify-between items-center py-1 px-2">{fieldContent}</div>
}

// Collapsible section component
const CollapsibleSection = ({
  title,
  fields,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
  defaultOpen = false,
}: {
  title: string
  fields: BlockFieldConfig[]
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
  defaultOpen?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-t border-border">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <Button
            type="text"
            size="tiny"
            className="w-full justify-start p-0 h-auto text-xs font-medium text-foreground-light hover:text-foreground"
          >
            <div className="flex items-center gap-1">
              {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>{title}</span>
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="mt-1">
            {fields.map((field) => (
              <BlockField
                key={field.id}
                config={field}
                data={data}
                enrichedData={enrichedData}
                isLoading={isLoading}
                filterFields={filterFields}
                table={table}
              />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

// Single source of truth for field row styling
const FieldRow = ({
  label,
  value,
  expandButton,
}: {
  label: string
  value: React.ReactNode
  expandButton?: React.ReactNode
}) => (
  <div className="flex justify-between items-center py-1 px-2">
    <dt className="flex items-center gap-2 text-[13.5px] text-foreground-light">
      <span>{label}</span>
      {expandButton}
    </dt>
    <dd className="text-right">{value}</dd>
  </div>
)

// Reusable styled icon component
const StyledIcon = ({ icon: Icon, title }: { icon: any; title: string }) => (
  <div className="flex items-center gap-2 bg-surface-300 rounded p-0.5 border justify-center border-foreground-muted">
    <Icon className="w-4 h-4 text-foreground-lighter" strokeWidth={1} />
  </div>
)

// Primary field with expandable additional details
const FieldWithSeeMore = ({
  primaryField,
  additionalFields,
  data,
  enrichedData,
  isLoading,
  filterFields,
  table,
  showValueAsBadge = false,
}: {
  primaryField: BlockFieldConfig
  additionalFields: BlockFieldConfig[]
  data: any
  enrichedData?: any
  isLoading?: boolean
  filterFields: DataTableFilterField<any>[]
  table: Table<any>
  showValueAsBadge?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const hasAdditionalData = additionalFields.some(
    (field) => field.getValue(data, enrichedData) && field.getValue(data, enrichedData) !== 'N/A'
  )

  const primaryValue = primaryField.getValue(data, enrichedData)
  const shouldShowSkeleton = primaryField.requiresEnrichedData && isLoading && !primaryValue
  const isApiKeyField = primaryField.id === 'api_key_role'

  // Common value rendering logic
  const renderValue = () => {
    if (shouldShowSkeleton) {
      return <Skeleton className="h-4 w-24" />
    }

    if (isApiKeyField && primaryValue && primaryValue !== 'N/A') {
      return (
        <span className="border border-border rounded px-2 py-1 bg-surface-100 text-xs font-mono text-foreground">
          {primaryValue}
        </span>
      )
    }

    if (showValueAsBadge && primaryValue && primaryValue !== 'N/A') {
      return (
        <Badge variant="secondary" size="small">
          {primaryValue}
        </Badge>
      )
    }

    return (
      <span
        className={`text-sm font-mono text-foreground ${
          primaryValue === 'N/A' ? 'text-foreground-light' : ''
        }`}
      >
        {primaryValue ?? 'N/A'}
      </span>
    )
  }

  const expandButton = hasAdditionalData ? (
    <CollapsibleTrigger asChild>
      <button className="w-3 h-3 flex items-center justify-center selection:font-mono text-foreground-lighter text-xs hover:text-foreground-light bg-foreground-muted/75 rounded [&[data-state=open]>svg]:rotate-180 hover:bg-foreground-lighter">
        <X size={10} className="text-background-surface-400 rotate-45" strokeWidth={3} />
      </button>
    </CollapsibleTrigger>
  ) : undefined

  return (
    <div className="border-t border-border">
      {hasAdditionalData ? (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <FieldRow label={primaryField.label} value={renderValue()} expandButton={expandButton} />
          <CollapsibleContent className="transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
            <div className="mt-1">
              {additionalFields.map((field) => (
                <BlockField
                  key={field.id}
                  config={field}
                  data={data}
                  enrichedData={enrichedData}
                  isLoading={isLoading}
                  filterFields={filterFields}
                  table={table}
                />
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      ) : (
        <FieldRow label={primaryField.label} value={renderValue()} />
      )}
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
}: {
  title: string
  status?: number | string
  statusText?: string
  children: React.ReactNode
  completionTime?: string
  isLast?: boolean
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
              {title === 'Request started' && <StyledIcon icon={Clock} title={title} />}
              {title === 'Network' && <StyledIcon icon={Globe} title={title} />}
              {title === 'Data API' && <StyledIcon icon={Server} title={title} />}
              {title === 'Authentication' && <StyledIcon icon={Auth} title={title} />}
              {title === 'Edge Function' && <StyledIcon icon={EdgeFunctions} title={title} />}
              {title === 'Storage' && <StyledIcon icon={Storage} title={title} />}
              {title === 'Postgres' && <StyledIcon icon={Database} title={title} />}
              {title === 'Response' && <StyledIcon icon={Clock} title={title} />}
              <h3 className="text-sm text-foreground tracking-wide">{title}</h3>
            </div>

            {statusText && (
              <span className="text-xs text-foreground-light tracking-wide">{statusText}</span>
            )}

            {status && (
              <DataTableColumnStatusCode
                value={status}
                level={getStatusLevel(status)}
                className="text-xs"
              />
            )}
          </div>
        </div>
      </div>

      {/* Main section box */}
      <div className="border rounded-b border-border">
        {/* Content */}
        <dl className="space-y-0 divide-y px-1 py-1 bg-surface-100/50">{children}</dl>
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

// Field configurations - using filterable field IDs where possible
const originFields: BlockFieldConfig[] = [
  {
    id: 'date', // Matches filterFields 'date' (timerange) - FILTERABLE
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

// Primary Network Fields (Always Visible) - FILTERABLE
const networkPrimaryFields: BlockFieldConfig[] = [
  {
    id: 'host', // Matches filterFields 'host' (input) - FILTERABLE
    label: 'Host',
    getValue: (data, enrichedData) =>
      enrichedData?.request_host || enrichedData?.host || data?.host,
  },
  {
    id: 'method', // Matches filterFields 'method' (checkbox) - FILTERABLE
    label: 'Method',
    getValue: (data, enrichedData) =>
      enrichedData?.request_method || enrichedData?.method || data?.method,
  },
  {
    id: 'pathname', // Matches filterFields 'pathname' (input) - FILTERABLE
    label: 'Path',
    getValue: (data, enrichedData) =>
      enrichedData?.request_path || enrichedData?.pathname || data?.pathname,
  },
  {
    id: 'user_agent',
    label: 'Client',
    getValue: (data, enrichedData) => {
      const userAgent = enrichedData?.headers_user_agent
      if (!userAgent) return null
      // TODO: Parse user agent for nice display with icons
      return userAgent.length > 50 ? userAgent.substring(0, 50) + '...' : userAgent
    },
    requiresEnrichedData: true,
  },
]

// Primary API Key Field (Always Visible) - Shows API key type only
const apiKeyPrimaryField: BlockFieldConfig = {
  id: 'api_key_role',
  label: 'API Key',
  getValue: (data, enrichedData) => {
    const prefix = enrichedData?.api_key_prefix
    const jwtRole = enrichedData?.jwt_key_role
    const authRole = enrichedData?.authorization_role

    if (prefix) {
      // Extract key type from prefix
      if (prefix.includes('publishable')) return 'publishable'
      else if (prefix.includes('secret')) return 'secret'
      return 'unknown'
    }

    // Fallback to JWT apikey postgres role if no API key prefix
    if (jwtRole) {
      return jwtRole
    }

    // Fallback to authorization postgres role if no apikey JWT
    if (authRole) {
      return authRole
    }

    return null
  },
  requiresEnrichedData: true,
}

// Additional API Key Fields (Collapsible)
const apiKeyAdditionalFields: BlockFieldConfig[] = [
  {
    id: 'api_key_prefix_full',
    label: 'API Key Prefix',
    getValue: (data, enrichedData) => {
      const prefix = enrichedData?.api_key_prefix
      return prefix || null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'postgres_role',
    label: 'Postgres Role',
    getValue: (data, enrichedData) => enrichedData?.jwt_key_role,
    requiresEnrichedData: true,
  },
  {
    id: 'api_key_error',
    label: 'API Key Error',
    getValue: (data, enrichedData) => enrichedData?.api_key_error,
    requiresEnrichedData: true,
  },
  {
    id: 'api_key_hash',
    label: 'API Key Hash',
    getValue: (data, enrichedData) => {
      const hash = enrichedData?.api_key_hash
      return hash ? `${hash.substring(0, 12)}...` : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'authorization_role',
    label: 'Postgres Role',
    getValue: (data, enrichedData) => enrichedData?.authorization_role,
    requiresEnrichedData: true,
  },
]

// Primary User Field (Always Visible)
const userPrimaryField: BlockFieldConfig = {
  id: 'user_id',
  label: 'User',
  getValue: (data, enrichedData) => {
    const userId = enrichedData?.user_id
    return userId ? `${userId.substring(0, 8)}...` : null
  },
  requiresEnrichedData: true,
}

// Additional User Fields (Collapsible)
const userAdditionalFields: BlockFieldConfig[] = [
  {
    id: 'auth_user', // Matches filterFields 'auth_user' (input) - FILTERABLE
    label: 'Auth User',
    getValue: (data, enrichedData) => enrichedData?.auth_user || data?.auth_user,
  },
  {
    id: 'user_email',
    label: 'User Email',
    getValue: (data, enrichedData) => enrichedData?.user_email,
    requiresEnrichedData: true,
  },
]

// Primary Location Field (Always Visible)
const locationPrimaryField: BlockFieldConfig = {
  id: 'client_country',
  label: 'Location',
  getValue: (data, enrichedData) => {
    const country = enrichedData?.client_country || enrichedData?.cf_country
    const city = enrichedData?.client_city
    if (country && city) return `${city}, ${country}`
    if (country) return country
    if (city) return city
    return null
  },
  requiresEnrichedData: true,
}

// Additional Location Fields (Collapsible) - includes IP addresses
const locationAdditionalFields: BlockFieldConfig[] = [
  {
    id: 'client_continent',
    label: 'Continent',
    getValue: (data, enrichedData) => enrichedData?.client_continent,
    requiresEnrichedData: true,
  },
  {
    id: 'client_region',
    label: 'Region',
    getValue: (data, enrichedData) => enrichedData?.client_region,
    requiresEnrichedData: true,
  },
  {
    id: 'client_timezone',
    label: 'Timezone',
    getValue: (data, enrichedData) => enrichedData?.client_timezone,
    requiresEnrichedData: true,
  },
  {
    id: 'x_real_ip',
    label: 'Real IP',
    getValue: (data, enrichedData) => enrichedData?.headers_x_real_ip,
    requiresEnrichedData: true,
  },
  {
    id: 'client_ip',
    label: 'Client IP',
    getValue: (data, enrichedData) => enrichedData?.client_ip,
    requiresEnrichedData: true,
  },
]

// Authorization Fields (Collapsible) - JWT authorization details
const authorizationFields: BlockFieldConfig[] = [
  {
    id: 'jwt_auth_key_id',
    label: 'Key ID',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_key_id || enrichedData?.jwt_apikey_key_id,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_session_id',
    label: 'Session ID',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_session_id || enrichedData?.jwt_apikey_session_id,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_subject',
    label: 'Subject',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_subject || enrichedData?.jwt_apikey_subject,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_issuer',
    label: 'Issuer',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_issuer || enrichedData?.jwt_apikey_issuer,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_algorithm',
    label: 'Algorithm',
    getValue: (data, enrichedData) =>
      enrichedData?.jwt_auth_algorithm || enrichedData?.jwt_apikey_algorithm,
    requiresEnrichedData: true,
  },
  {
    id: 'jwt_auth_expires_at',
    label: 'Expires At',
    getValue: (data, enrichedData) => {
      const expiresAt = enrichedData?.jwt_auth_expires_at || enrichedData?.jwt_apikey_expires_at
      if (!expiresAt) return null
      try {
        return new Date(expiresAt * 1000).toLocaleString()
      } catch {
        return expiresAt
      }
    },
    requiresEnrichedData: true,
  },
]

// Tech Details Fields (Collapsible)
const techDetailsFields: BlockFieldConfig[] = [
  {
    id: 'network_protocol',
    label: 'Protocol',
    getValue: (data, enrichedData) => enrichedData?.network_protocol,
    requiresEnrichedData: true,
  },
  {
    id: 'cf_datacenter',
    label: 'Datacenter',
    getValue: (data, enrichedData) =>
      enrichedData?.network_datacenter || enrichedData?.cf_datacenter,
    requiresEnrichedData: true,
  },
  {
    id: 'cache_status',
    label: 'Cache Status',
    getValue: (data, enrichedData) => enrichedData?.response_cache_status,
    requiresEnrichedData: true,
  },
  {
    id: 'cf_ray',
    label: 'CF-Ray',
    getValue: (data, enrichedData) => enrichedData?.cf_ray,
    requiresEnrichedData: true,
  },
  {
    id: 'x_client_info',
    label: 'SDK',
    getValue: (data, enrichedData) => enrichedData?.headers_x_client_info,
    requiresEnrichedData: true,
  },
  {
    id: 'x_forwarded_proto',
    label: 'Forwarded Proto',
    getValue: (data, enrichedData) => enrichedData?.headers_x_forwarded_proto,
    requiresEnrichedData: true,
  },
]

// Primary PostgREST Fields (Always Visible) - FILTERABLE
const postgrestPrimaryFields: BlockFieldConfig[] = [
  {
    id: 'status', // Matches filterFields 'status' (checkbox) - FILTERABLE
    label: 'Status',
    getValue: (data, enrichedData) => enrichedData?.status || data?.status,
  },
  {
    id: 'postgres_role',
    label: 'Postgres Role',
    getValue: (data, enrichedData) => enrichedData?.api_role,
    requiresEnrichedData: true,
  },
  {
    id: 'response_time',
    label: 'Response Time',
    getValue: (data, enrichedData) => {
      const time = enrichedData?.response_origin_time || data?.response_time_ms
      return time ? `${time}ms` : null
    },
    requiresEnrichedData: true,
  },
]

// PostgREST Response Details (Collapsible)
const postgrestResponseFields: BlockFieldConfig[] = [
  {
    id: 'query_params',
    label: 'Query',
    getValue: (data, enrichedData) => enrichedData?.request_search,
    requiresEnrichedData: true,
  },
  {
    id: 'content_type',
    label: 'Content Type',
    getValue: (data, enrichedData) => enrichedData?.response_content_type,
    requiresEnrichedData: true,
  },
  {
    id: 'message',
    label: 'Message',
    getValue: (data, enrichedData) => enrichedData?.message,
    requiresEnrichedData: true,
  },
]

const postgresFields: BlockFieldConfig[] = [
  {
    id: 'run_statement',
    label: 'Run statement',
    getValue: (data, enrichedData) =>
      enrichedData?.statement_count ? `${enrichedData.statement_count} spans` : null,
    requiresEnrichedData: true,
  },
  {
    id: 'execution_time',
    label: 'Execution time',
    getValue: (data, enrichedData) => {
      const time = enrichedData?.execution_time || enrichedData?.query_duration
      return time ? `${time}s` : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'postgres_version',
    label: 'Postgres version',
    getValue: (data, enrichedData) => enrichedData?.postgres_version,
    requiresEnrichedData: true,
  },
  {
    id: 'environment',
    label: 'Environment',
    getValue: (data, enrichedData) => enrichedData?.environment,
    requiresEnrichedData: true,
  },
  {
    id: 'region',
    label: 'Region',
    getValue: (data, enrichedData) => enrichedData?.region,
    requiresEnrichedData: true,
  },
  {
    id: 'memory_used',
    label: 'Estimated memory used',
    getValue: (data, enrichedData) => enrichedData?.memory_used,
    requiresEnrichedData: true,
  },
]

// Primary GoTrue/Auth Fields (Always Visible)
const authPrimaryFields: BlockFieldConfig[] = [
  {
    id: 'auth_path',
    label: 'Auth Path',
    getValue: (data, enrichedData) => {
      return enrichedData?.path || enrichedData?.request_path || data?.path
    },
    requiresEnrichedData: true,
  },
  {
    id: 'log_id',
    label: 'Log ID',
    getValue: (data, enrichedData) => {
      const logId = data?.id || enrichedData?.id
      return logId ? `${logId.substring(0, 8)}...` : null
    },
  },
  {
    id: 'referer',
    label: 'Referer',
    getValue: (data, enrichedData) => {
      return enrichedData?.headers_referer || null
    },
    requiresEnrichedData: true,
  },
]

// Primary Edge Function Fields (Always Visible)
const edgeFunctionPrimaryFields: BlockFieldConfig[] = [
  {
    id: 'status',
    label: 'Status',
    getValue: (data, enrichedData) => enrichedData?.status || data?.status,
  },
  {
    id: 'function_path',
    label: 'Function Path',
    getValue: (data, enrichedData) => {
      return (
        enrichedData?.path || enrichedData?.request_path || data?.path || enrichedData?.request_url
      )
    },
    requiresEnrichedData: false,
  },
  {
    id: 'execution_time',
    label: 'Execution Time',
    getValue: (data, enrichedData) => {
      const time = enrichedData?.execution_time_ms || data?.execution_time_ms
      return time ? `${time}ms` : null
    },
    requiresEnrichedData: false,
  },
  {
    id: 'execution_id',
    label: 'Execution ID',
    getValue: (data, enrichedData) => {
      const execId = enrichedData?.execution_id || data?.execution_id
      return execId ? `${execId.substring(0, 8)}...` : null
    },
    requiresEnrichedData: false,
  },
]

// Edge Function Details (Collapsible)
const edgeFunctionDetailsFields: BlockFieldConfig[] = [
  {
    id: 'function_id',
    label: 'Function ID',
    getValue: (data, enrichedData) => {
      const funcId = enrichedData?.function_id || data?.function_id
      return funcId ? `${funcId.substring(0, 8)}...` : null
    },
    requiresEnrichedData: false,
  },
  {
    id: 'execution_region',
    label: 'Execution Region',
    getValue: (data, enrichedData) => {
      return enrichedData?.execution_region || data?.execution_region || null
    },
    requiresEnrichedData: false,
  },
  {
    id: 'function_log_count',
    label: 'Function Logs',
    getValue: (data, enrichedData) => {
      const count = enrichedData?.function_log_count || data?.function_log_count || data?.log_count
      return count ? `${count} logs` : 'No logs'
    },
    requiresEnrichedData: false,
  },
  {
    id: 'method',
    label: 'Method',
    getValue: (data, enrichedData) => enrichedData?.method || data?.method,
    requiresEnrichedData: false,
  },
  {
    id: 'user_agent',
    label: 'User Agent',
    getValue: (data, enrichedData) => {
      const ua = enrichedData?.headers_user_agent || data?.headers_user_agent
      return ua ? (ua.length > 30 ? `${ua.substring(0, 30)}...` : ua) : null
    },
    requiresEnrichedData: false,
  },
]

// Request Started - Simple header component with connecting line
export const RequestStartedBlock = memo(
  ({ data, enrichedData }: { data: any; enrichedData?: any }) => {
    const timestamp = data?.timestamp || data?.date
    const formattedTime = timestamp ? new Date(timestamp).toLocaleString() : null

    return (
      <div className="">
        <div className="flex items-center justify-between py-0 px-2">
          <div className="flex items-center gap-2 text-sm text-foreground-light">
            <StyledIcon icon={Clock} title="Request started" />
            <span>Request started</span>
          </div>
          {formattedTime && (
            <span className="text-sm font-mono text-foreground-light">{formattedTime}</span>
          )}
        </div>
        {/* Connecting line to first timeline block */}
        <div className="border-l h-4 ml-5"></div>
      </div>
    )
  }
)

RequestStartedBlock.displayName = 'RequestStartedBlock'

// Network/Cloudflare
export const NetworkBlock = memo(
  ({ data, enrichedData, isLoading, filterFields, table }: ServiceFlowBlockProps) => {
    return (
      <TimelineStep title="Network">
        {/* Primary Display Fields */}
        {networkPrimaryFields.map((field) => (
          <BlockField
            key={field.id}
            config={field}
            data={data}
            enrichedData={enrichedData}
            isLoading={isLoading}
            filterFields={filterFields}
            table={table}
          />
        ))}

        <FieldWithSeeMore
          primaryField={apiKeyPrimaryField}
          additionalFields={apiKeyAdditionalFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
          showValueAsBadge={true}
        />

        <FieldWithSeeMore
          primaryField={userPrimaryField}
          additionalFields={userAdditionalFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />

        <FieldWithSeeMore
          primaryField={locationPrimaryField}
          additionalFields={locationAdditionalFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />

        <CollapsibleSection
          title="Authorization"
          fields={authorizationFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />

        <CollapsibleSection
          title="Tech Details"
          fields={techDetailsFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />
      </TimelineStep>
    )
  }
)

NetworkBlock.displayName = 'NetworkBlock'

// PostgREST
export const PostgRESTBlock = memo(
  ({ data, enrichedData, isLoading, filterFields, table }: ServiceFlowBlockProps) => {
    return (
      <TimelineStep title="Data API" status={data?.status}>
        {/* Primary Display Fields */}
        {postgrestPrimaryFields.map((field) => (
          <BlockField
            key={field.id}
            config={field}
            data={data}
            enrichedData={enrichedData}
            isLoading={isLoading}
            filterFields={filterFields}
            table={table}
          />
        ))}

        <CollapsibleSection
          title="Response Details"
          fields={postgrestResponseFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />
      </TimelineStep>
    )
  }
)

// GoTrue (Auth Service)
export const GoTrueBlock = memo(
  ({ data, enrichedData, isLoading, filterFields, table }: ServiceFlowBlockProps) => {
    return (
      <TimelineStep title="Authentication" status={data?.status}>
        {/* Primary Display Fields */}
        {authPrimaryFields.map((field) => (
          <BlockField
            key={field.id}
            config={field}
            data={data}
            enrichedData={enrichedData}
            isLoading={isLoading}
            filterFields={filterFields}
            table={table}
          />
        ))}
      </TimelineStep>
    )
  }
)

PostgRESTBlock.displayName = 'PostgRESTBlock'

GoTrueBlock.displayName = 'GoTrueBlock'

// Edge Function
export const EdgeFunctionBlock = memo(
  ({ data, enrichedData, isLoading, filterFields, table }: ServiceFlowBlockProps) => {
    // Debug logging to see what data we're getting
    if (DEBUG_SERVICE_FLOW) {
      console.log('🔍 EdgeFunctionBlock - data:', data)
      console.log('🔍 EdgeFunctionBlock - enrichedData:', enrichedData)
      console.log('🔍 EdgeFunctionBlock - isLoading:', isLoading)

      // Debug specific field values
      console.log('🔍 Field values:')
      console.log(
        '  - execution_time_ms:',
        enrichedData?.execution_time_ms || data?.execution_time_ms
      )
      console.log('  - execution_id:', enrichedData?.execution_id || data?.execution_id)
      console.log('  - function_id:', enrichedData?.function_id || data?.function_id)
      console.log(
        '  - path:',
        enrichedData?.path || enrichedData?.request_path || data?.path || enrichedData?.request_url
      )
    }

    return (
      <TimelineStep title="Edge Function" status={data?.status}>
        {/* Primary Display Fields */}
        {edgeFunctionPrimaryFields.map((field) => (
          <BlockField
            key={field.id}
            config={field}
            data={data}
            enrichedData={enrichedData}
            isLoading={isLoading}
            filterFields={filterFields}
            table={table}
          />
        ))}

        <CollapsibleSection
          title="Function Details"
          fields={edgeFunctionDetailsFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />

        {/* First 5 Function Logs */}
        {data?.logs && data.logs.length > 0 && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-foreground mb-2">
              Function Logs ({data.logs.length})
            </h4>
            <div className="space-y-1">
              {data.logs.slice(0, 5).map((log: any, index: number) => {
                return (
                  <div
                    key={log.id || index}
                    className="flex items-center justify-between py-1 px-2 bg-surface-200 rounded border"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-xs font-mono uppercase min-w-[40px] text-center ${
                          log.level === 'error'
                            ? 'bg-destructive text-destructive-foreground'
                            : log.level === 'warn'
                              ? 'bg-warning text-warning-foreground'
                              : 'bg-surface-300 text-foreground-light'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span className="text-foreground text-xs font-mono flex-1">
                        {log.event_message}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-foreground-light text-xs font-mono">
                        {new Date(Number(log.timestamp) / 1000).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )
              })}
              {data.logs.length > 5 && (
                <div className="text-xs text-foreground-light px-2 py-1 italic text-center">
                  ... and {data.logs.length - 5} more logs
                </div>
              )}
            </div>
          </div>
        )}
      </TimelineStep>
    )
  }
)

EdgeFunctionBlock.displayName = 'EdgeFunctionBlock'

// Primary Storage Fields (Always Visible)
const storagePrimaryFields: BlockFieldConfig[] = [
  {
    id: 'status',
    label: 'Status',
    getValue: (data, enrichedData) => enrichedData?.status || data?.status,
  },
  {
    id: 'filename',
    label: 'File Name',
    getValue: (data, enrichedData) => {
      const path = enrichedData?.path || enrichedData?.request_path || data?.path
      return path ? getFileName(path) : null
    },
    requiresEnrichedData: false,
  },
  {
    id: 'content_type_size',
    label: 'Type & Size',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      // For deleted objects, show status message
      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return `Error ${status}`
      }

      // Try to get metadata like PreviewPane does
      const metadata = getStorageMetadata(data, enrichedData)
      const mimeType = metadata?.mimetype
      const size = metadata?.size

      // Fallback to headers if metadata not available
      const contentType =
        mimeType ||
        enrichedData?.response_content_type ||
        enrichedData?.storage_request_content_type
      const contentLength =
        size ||
        (enrichedData?.storage_content_length
          ? parseInt(enrichedData.storage_content_length)
          : null)

      if (contentType && contentLength) {
        return `${contentType} - ${formatBytes(contentLength)}`
      } else if (contentType) {
        return contentType
      } else if (contentLength) {
        return formatBytes(contentLength)
      }
      return 'Unknown type'
    },
    requiresEnrichedData: true,
  },
  {
    id: 'response_time',
    label: 'Response Time',
    getValue: (data, enrichedData) => {
      const time = enrichedData?.response_origin_time || data?.response_time_ms
      return time ? `${time}ms` : null
    },
    requiresEnrichedData: true,
  },
]

// Storage Details (Collapsible)
const storageDetailsFields: BlockFieldConfig[] = [
  {
    id: 'storage_path',
    label: 'Storage Path',
    getValue: (data, enrichedData) => {
      const path = enrichedData?.path || enrichedData?.request_path || data?.path
      // Extract just the object path from the full storage path
      const match = path?.match(/\/storage\/v1\/object\/([^\/]+)\/(.+)/)
      if (match) {
        const [, bucketName, objectPath] = match
        return `${bucketName}/${objectPath}`
      }
      return path
    },
    requiresEnrichedData: false,
  },
  {
    id: 'last_modified',
    label: 'Last Modified',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return 'Unavailable'
      }

      // Try to get dates from metadata like PreviewPane does
      const metadata = getStorageMetadata(data, enrichedData)
      const updatedAt = metadata?.updated_at || data?.updated_at || enrichedData?.updated_at
      const lastModified = enrichedData?.storage_last_modified || updatedAt

      return lastModified ? formatStorageDate(lastModified) : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'etag',
    label: 'ETag',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return 'Unavailable'
      }

      const etag = enrichedData?.storage_etag
      return etag ? `${etag.substring(0, 12)}...` : null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'content_disposition',
    label: 'Content Disposition',
    getValue: (data, enrichedData) => {
      const status = enrichedData?.status || data?.status
      const isObjectDeleted = status === 404 || status === '404'
      const hasError = status && Number(status) >= 400

      if (isObjectDeleted) {
        return 'Object deleted'
      } else if (hasError) {
        return 'Unavailable'
      }

      return enrichedData?.storage_content_disposition || null
    },
    requiresEnrichedData: true,
  },
  {
    id: 'method',
    label: 'Method',
    getValue: (data, enrichedData) => enrichedData?.method || data?.method,
    requiresEnrichedData: false,
  },
  {
    id: 'user_agent',
    label: 'User Agent',
    getValue: (data, enrichedData) => {
      const ua = enrichedData?.headers_user_agent || data?.headers_user_agent
      return ua ? (ua.length > 30 ? `${ua.substring(0, 30)}...` : ua) : null
    },
    requiresEnrichedData: false,
  },
]

// Helper function to extract file extension from path
const getFileExtension = (path: string): string => {
  const match = path.match(/\.([^.]+)$/)
  return match ? match[1].toLowerCase() : ''
}

// Helper function to get metadata from storage log data
const getStorageMetadata = (data: any, enrichedData?: any): any => {
  // Check if we have metadata in the raw log data
  const rawLogData = enrichedData?.raw_log_data || data?.raw_log_data
  if (rawLogData?.metadata) {
    return rawLogData.metadata
  }

  // Check if metadata is directly available in enriched data
  if (enrichedData?.metadata) {
    return enrichedData.metadata
  }

  // Check if metadata is in the original data
  if (data?.metadata) {
    return data.metadata
  }

  return null
}

// Helper function to extract filename from storage path
const getFileName = (path: string): string => {
  const match = path.match(/\/storage\/v1\/object\/[^\/]+\/(.+)/)
  if (match) {
    const objectPath = match[1]
    // Get the last part of the path (filename)
    const pathParts = objectPath.split('/')
    return pathParts[pathParts.length - 1]
  }
  // Fallback to extracting filename from any path
  const pathParts = path.split('/')
  return pathParts[pathParts.length - 1] || path
}

// Helper function to format date like PreviewPane does
const formatStorageDate = (dateString: string): string => {
  if (!dateString) return ''
  try {
    const date = new Date(dateString)
    return date.toLocaleString()
  } catch (error) {
    return dateString
  }
}

// Helper function to get object type from path or content type
const getObjectType = (path: string, contentType?: string): string => {
  const extension = getFileExtension(path)

  if (contentType) {
    if (contentType.startsWith('image/')) return 'Image'
    if (contentType.startsWith('video/')) return 'Video'
    if (contentType.startsWith('audio/')) return 'Audio'
    if (contentType.includes('pdf')) return 'PDF'
    if (contentType.includes('json')) return 'JSON'
    if (contentType.includes('text')) return 'Text'
  }

  // Fallback to extension-based detection
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp']
  const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm']
  const audioExts = ['mp3', 'wav', 'flac', 'aac', 'ogg']
  const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf']

  if (imageExts.includes(extension)) return 'Image'
  if (videoExts.includes(extension)) return 'Video'
  if (audioExts.includes(extension)) return 'Audio'
  if (docExts.includes(extension)) return 'Document'

  return extension.toUpperCase() || 'File'
}

// Helper function to check if file can be previewed
const isPreviewable = (path: string, contentType?: string): boolean => {
  const extension = getFileExtension(path)
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp']
  const videoExts = ['mp4', 'webm', 'ogg']
  const audioExts = ['mp3', 'wav', 'ogg', 'aac']

  if (contentType) {
    return (
      contentType.startsWith('image/') ||
      contentType.startsWith('video/') ||
      contentType.startsWith('audio/')
    )
  }

  return (
    imageExts.includes(extension) || videoExts.includes(extension) || audioExts.includes(extension)
  )
}

// Helper function to construct storage object URL
const getStorageObjectUrl = (projectRef: string, path: string): string => {
  // Extract bucket and object path from the full path
  // Path format: /storage/v1/object/bucketName/objectPath
  const match = path.match(/\/storage\/v1\/object\/([^\/]+)\/(.+)/)
  if (!match) return ''

  const [, bucketName, objectPath] = match
  return `https://${projectRef}.supabase.co/storage/v1/object/public/${bucketName}/${objectPath}`
}

// Empty State Component (like InnerSideBarEmptyPanel)
const StorageEmptyState = ({
  illustration,
  title,
  description,
  actions,
}: {
  illustration?: React.ReactNode
  title: string
  description?: string | React.ReactNode
  actions?: React.ReactNode
}) => {
  return (
    <div className="border border-muted bg-surface-100 dark:bg-surface-75 flex flex-col gap-y-3 items-center justify-center rounded-md px-5 py-4">
      <div className="w-full flex flex-col gap-y-1 items-center">
        {illustration}
        <p className="text-xs text-foreground-light">{title}</p>
        {description && (
          <p className="text-xs text-foreground-lighter text-center">{description}</p>
        )}
        {actions && <div className="mt-2">{actions}</div>}
      </div>
    </div>
  )
}

// Storage Object Preview Component
const StorageObjectPreview = ({
  data,
  enrichedData,
  projectRef,
}: {
  data: any
  enrichedData?: any
  projectRef: string
}) => {
  const path = enrichedData?.path || enrichedData?.request_path || data?.path
  const status = enrichedData?.status || data?.status
  const [mediaError, setMediaError] = useState(false)

  // Get metadata like PreviewPane does
  const metadata = getStorageMetadata(data, enrichedData)
  const mimeType = metadata?.mimetype

  // Fallback to headers if metadata not available
  const contentType =
    mimeType || enrichedData?.response_content_type || enrichedData?.storage_request_content_type

  // Check if object was deleted or not found
  const isObjectDeleted = status === 404 || status === '404'
  const isObjectForbidden = status === 403 || status === '403'
  const hasError = status && Number(status) >= 400

  if (!path) return null

  const objectUrl = getStorageObjectUrl(projectRef, path)
  const canPreview = isPreviewable(path, contentType)

  const renderPreview = () => {
    if (!contentType || !objectUrl || mediaError) return null

    if (contentType.includes('image')) {
      return (
        <img
          src={objectUrl}
          alt="Storage object preview"
          className="max-w-full h-auto max-h-48 object-contain"
          onError={() => setMediaError(true)}
          loading="lazy"
        />
      )
    }

    if (contentType.includes('video')) {
      return (
        <div className="flex h-48 w-full items-center justify-center p-2">
          <video
            key={objectUrl}
            controls
            className="max-h-full max-w-full"
            onError={() => setMediaError(true)}
          >
            <source src={objectUrl} type={contentType} />
            <p className="text-sm text-foreground-light">
              Your browser does not support the video tag.
            </p>
          </video>
        </div>
      )
    }

    if (contentType.includes('audio')) {
      return (
        <div className="flex h-24 w-full items-center justify-center p-4">
          <audio key={objectUrl} controls className="w-full" onError={() => setMediaError(true)}>
            <source src={objectUrl} type={contentType} />
            <p className="text-sm text-foreground-light">
              Your browser does not support the audio element.
            </p>
          </audio>
        </div>
      )
    }

    return null
  }

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-medium text-foreground">
          {canPreview && !hasError && !mediaError ? 'Preview' : 'Object Status'}
        </h4>
        {canPreview && !hasError && !mediaError && objectUrl && (
          <Button
            type="text"
            size="tiny"
            className="text-xs"
            iconRight={<ExternalLink className="h-3 w-3" />}
            onClick={() => window.open(objectUrl, '_blank')}
          >
            Open
          </Button>
        )}
      </div>

      {isObjectDeleted ? (
        <StorageEmptyState
          illustration={<FileX className="h-8 w-8 text-foreground-lighter" />}
          title="Object Not Found"
          description="This storage object has been deleted"
        />
      ) : isObjectForbidden ? (
        <StorageEmptyState
          illustration={<AlertCircle className="h-8 w-8 text-foreground-lighter" />}
          title="Access Forbidden"
          description="No permission to access this object"
          actions={
            objectUrl ? (
              <Button
                type="text"
                size="tiny"
                iconRight={<ExternalLink className="h-3 w-3" />}
                onClick={() => window.open(objectUrl, '_blank')}
              >
                Try to open anyway
              </Button>
            ) : undefined
          }
        />
      ) : hasError ? (
        <StorageEmptyState
          illustration={<X className="h-8 w-8 text-foreground-lighter" />}
          title={`Error ${status}`}
          description="Unable to access storage object"
          actions={
            objectUrl ? (
              <Button
                type="text"
                size="tiny"
                iconRight={<ExternalLink className="h-3 w-3" />}
                onClick={() => window.open(objectUrl, '_blank')}
              >
                Try to open anyway
              </Button>
            ) : undefined
          }
        />
      ) : canPreview && !mediaError ? (
        <div className="border border-border rounded-lg overflow-hidden bg-surface-100">
          {renderPreview()}
        </div>
      ) : canPreview && mediaError ? (
        <StorageEmptyState
          illustration={<X className="h-8 w-8 text-foreground-lighter" />}
          title="Preview Unavailable"
          description="Could not load media preview"
          actions={
            objectUrl ? (
              <Button
                type="text"
                size="tiny"
                iconRight={<ExternalLink className="h-3 w-3" />}
                onClick={() => window.open(objectUrl, '_blank')}
              >
                Open original
              </Button>
            ) : undefined
          }
        />
      ) : (
        <StorageEmptyState
          illustration={<Storage className="h-8 w-8 text-foreground-lighter" />}
          title="Preview Not Available"
          description={`${getFileName(path)} • ${contentType || 'Unknown type'}`}
          actions={
            objectUrl ? (
              <Button
                type="text"
                size="tiny"
                iconRight={<ExternalLink className="h-3 w-3" />}
                onClick={() => window.open(objectUrl, '_blank')}
              >
                Open file
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  )
}

// Storage
export const StorageBlock = memo(
  ({ data, enrichedData, isLoading, filterFields, table }: ServiceFlowBlockProps) => {
    const { ref: projectRef } = useParams()

    return (
      <TimelineStep title="Storage" status={data?.status}>
        {/* Primary Display Fields */}
        {storagePrimaryFields.map((field) => (
          <BlockField
            key={field.id}
            config={field}
            data={data}
            enrichedData={enrichedData}
            isLoading={isLoading}
            filterFields={filterFields}
            table={table}
          />
        ))}

        <CollapsibleSection
          title="Storage Details"
          fields={storageDetailsFields}
          data={data}
          enrichedData={enrichedData}
          isLoading={isLoading}
          filterFields={filterFields}
          table={table}
        />

        {/* Object Preview */}
        {projectRef && (
          <StorageObjectPreview data={data} enrichedData={enrichedData} projectRef={projectRef} />
        )}
      </TimelineStep>
    )
  }
)

StorageBlock.displayName = 'StorageBlock'

// Postgres
export const PostgresBlock = memo(
  ({
    data,
    enrichedData,
    isLoading,
    isLast = true,
    filterFields,
    table,
  }: ServiceFlowBlockProps) => {
    const hasError = data?.status && Number(data.status) >= 400
    const isSkipped = hasError

    return (
      <TimelineStep
        title="Postgres"
        status={isSkipped ? undefined : data?.status}
        statusText={isSkipped ? 'SKIPPED' : undefined}
        isLast={isLast}
      >
        {isSkipped ? (
          <div className="text-sm text-foreground-light italic py-2">
            Skipped due to PostgREST error
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <BarChart3 size={20} className="text-foreground-lighter mb-2" />
            <div className="text-sm text-foreground-light">More data insights coming soon</div>
          </div>
        )}
      </TimelineStep>
    )
  }
)

PostgresBlock.displayName = 'PostgresBlock'

// Response (final step) - Simple completion marker with error details
export const ResponseCompletedBlock = memo(({ data }: { data: any }) => {
  const hasError = data?.status && Number(data.status) >= 400
  const responseTime = data?.response_time_ms || data?.duration_ms
  const status = Number(data?.status)

  return (
    <TimelineStep title="Response" status={data?.status} isLast={true}>
      <div className="text-sm text-foreground-light py-2">
        {hasError
          ? responseTime
            ? `Error response sent to client in ${responseTime}ms`
            : 'Error response sent to client'
          : responseTime
            ? `Response sent to client in ${responseTime}ms`
            : 'Response sent to client'}
      </div>

      {/* Show error details if there's an error */}
      {hasError && (
        <div className="border-t border-border mt-2 pt-2">
          <div className="text-sm font-medium text-destructive mb-1">Error Details</div>
          <div className="text-sm text-foreground-light">
            {status >= 500
              ? 'Server error occurred during request processing'
              : status >= 400
                ? 'Client error - check request parameters and authentication'
                : 'Request completed with error status'}
          </div>
        </div>
      )}
    </TimelineStep>
  )
})

ResponseCompletedBlock.displayName = 'ResponseCompletedBlock'

// Memoized exports
export const MemoizedRequestStartedBlock = memo(RequestStartedBlock, (prev, next) => {
  return prev.data === next.data && prev.enrichedData === next.enrichedData
}) as typeof RequestStartedBlock

export const MemoizedNetworkBlock = memo(NetworkBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof NetworkBlock

export const MemoizedPostgRESTBlock = memo(PostgRESTBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof PostgRESTBlock

export const MemoizedGoTrueBlock = memo(GoTrueBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof GoTrueBlock

export const MemoizedEdgeFunctionBlock = memo(EdgeFunctionBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof EdgeFunctionBlock

export const MemoizedStorageBlock = memo(StorageBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof StorageBlock

export const MemoizedPostgresBlock = memo(PostgresBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof PostgresBlock

export const MemoizedResponseCompletedBlock = memo(ResponseCompletedBlock, (prev, next) => {
  return prev.data === next.data
}) as typeof ResponseCompletedBlock
