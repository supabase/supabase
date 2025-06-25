# Service Flow Integration Example

## What We've Built

1. **SQL Query (`getPostgrestServiceFlowQuery`)** - Fetches enriched PostgREST edge log data
2. **React Hook (`useServiceFlowData`)** - Manages the data fetching with React Query
3. **TypeScript Types** - Proper type safety for service flow data

## Integration into Inspection Panel

Here's how you would modify the inspection panel to show the PostgREST service flow:

### 1. Update UnifiedLogs.tsx to fetch service flow data

```typescript
// In UnifiedLogs.tsx - Add the service flow hook
import { useServiceFlowData } from './ServiceFlow.queries'

const { data: serviceFlowData, isLoading: isServiceFlowLoading } = useServiceFlowData(
  selectedRow?.original || null,
  projectRef ?? ''
)
```

### 2. Pass service flow data to the inspection panel

```typescript
// In the inspection panel section
<TabsContent value="details">
  <MemoizedDataTableSheetContent
    table={table}
    data={selectedRow?.original}
    filterFields={filterFields}
    fields={sheetFields}
    serviceFlowData={serviceFlowData} // 👈 Pass the service flow data
    isServiceFlowLoading={isServiceFlowLoading}
    metadata={{
      totalRows: totalDBRowCount ?? 0,
      filterRows: filterDBRowCount ?? 0,
      totalRowsFetched: totalFetched ?? 0,
      currentPercentiles: metadata?.currentPercentiles ?? ({} as any),
      ...metadata,
    }}
  />
</TabsContent>
```

### 3. Create a PostgREST ServiceFlowPanel component

```typescript
// New component: ServiceFlowPanel.tsx
import { ServiceFlowData } from '../UnifiedLogs.types'

interface ServiceFlowPanelProps {
  serviceFlowData?: ServiceFlowData
  isLoading: boolean
}

export const ServiceFlowPanel = ({ serviceFlowData, isLoading }: ServiceFlowPanelProps) => {
  if (isLoading) {
    return <div className="space-y-4">
      <ServiceRequestSkeleton />
    </div>
  }

  if (!serviceFlowData || serviceFlowData.flowType === 'unsupported') {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>{serviceFlowData?.message || 'Service flow not available for this log type'}</p>
      </div>
    )
  }

  const { postgrestLogs } = serviceFlowData

  return (
    <div className="space-y-4">
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-surface-100 px-4 py-2 border-b flex items-center justify-between">
          <h3 className="font-medium text-sm">PostgREST Request</h3>
          <span className="text-xs text-muted-foreground">
            {postgrestLogs.length} log{postgrestLogs.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {postgrestLogs.map((log) => (
          <div key={log.id} className="p-4 border-b last:border-b-0">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <StatusIndicator level={log.level} />
                <span className="font-mono text-sm">{log.method} {log.path}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(Number(log.timestamp) / 1000).toLocaleTimeString()}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <span className="ml-2 font-mono">{log.status_code}</span>
              </div>
              {log.response_time_ms && (
                <div>
                  <span className="text-muted-foreground">Response Time:</span>
                  <span className="ml-2 font-mono">{log.response_time_ms}ms</span>
                </div>
              )}
              {log.auth_user && (
                <div>
                  <span className="text-muted-foreground">User:</span>
                  <span className="ml-2 font-mono">{log.auth_user}</span>
                </div>
              )}
              {log.api_role && (
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <span className="ml-2 font-mono">{log.api_role}</span>
                </div>
              )}
            </div>

            {/* PostgREST-specific data tabs */}
            <Tabs defaultValue="request" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="request">Request</TabsTrigger>
                <TabsTrigger value="response">Response</TabsTrigger>
                <TabsTrigger value="network">Network</TabsTrigger>
              </TabsList>

              <TabsContent value="request" className="mt-3">
                <div className="space-y-2 text-sm">
                  {log.service_specific_data.query_string && (
                    <div>
                      <span className="text-muted-foreground">Query:</span>
                      <code className="ml-2 bg-surface-100 px-2 py-1 rounded text-xs">
                        {log.service_specific_data.query_string}
                      </code>
                    </div>
                  )}
                  {log.service_specific_data.content_type && (
                    <div>
                      <span className="text-muted-foreground">Content-Type:</span>
                      <span className="ml-2 font-mono">{log.service_specific_data.content_type}</span>
                    </div>
                  )}
                  {log.service_specific_data.prefer && (
                    <div>
                      <span className="text-muted-foreground">Prefer:</span>
                      <span className="ml-2 font-mono">{log.service_specific_data.prefer}</span>
                    </div>
                  )}
                  {log.service_specific_data.range && (
                    <div>
                      <span className="text-muted-foreground">Range:</span>
                      <span className="ml-2 font-mono">{log.service_specific_data.range}</span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="response" className="mt-3">
                <div className="space-y-2 text-sm">
                  {log.service_specific_data.response_content_type && (
                    <div>
                      <span className="text-muted-foreground">Content-Type:</span>
                      <span className="ml-2 font-mono">{log.service_specific_data.response_content_type}</span>
                    </div>
                  )}
                  {log.service_specific_data.response_content_range && (
                    <div>
                      <span className="text-muted-foreground">Content-Range:</span>
                      <span className="ml-2 font-mono">{log.service_specific_data.response_content_range}</span>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="network" className="mt-3">
                <div className="space-y-2 text-sm">
                  {log.service_specific_data.cf_country && (
                    <div>
                      <span className="text-muted-foreground">Country:</span>
                      <span className="ml-2 font-mono">{log.service_specific_data.cf_country}</span>
                    </div>
                  )}
                  {log.service_specific_data.cf_connecting_ip && (
                    <div>
                      <span className="text-muted-foreground">IP:</span>
                      <span className="ml-2 font-mono">{log.service_specific_data.cf_connecting_ip}</span>
                    </div>
                  )}
                  {log.service_specific_data.cf_ray && (
                    <div>
                      <span className="text-muted-foreground">CF-Ray:</span>
                      <span className="ml-2 font-mono">{log.service_specific_data.cf_ray}</span>
                    </div>
                  )}
                  {log.service_specific_data.user_agent && (
                    <div>
                      <span className="text-muted-foreground">User-Agent:</span>
                      <span className="ml-2 font-mono text-xs break-all">{log.service_specific_data.user_agent}</span>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        ))}
      </div>
    </div>
  )
}

const StatusIndicator = ({ level }: { level: string }) => {
  const colors = {
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  }

  return (
    <div className={`w-2 h-2 rounded-full ${colors[level] || 'bg-gray-500'}`} />
  )
}

const ServiceRequestSkeleton = () => (
  <div className="border rounded-lg overflow-hidden">
    <div className="bg-surface-100 px-4 py-2 border-b">
      <div className="h-4 bg-surface-200 rounded w-32 animate-pulse" />
    </div>
    <div className="p-4">
      <div className="space-y-3">
        <div className="h-3 bg-surface-200 rounded w-full animate-pulse" />
        <div className="h-3 bg-surface-200 rounded w-3/4 animate-pulse" />
        <div className="h-3 bg-surface-200 rounded w-1/2 animate-pulse" />
      </div>
    </div>
  </div>
)
```

### 4. Update TypeScript types

```typescript
// In UnifiedLogs.types.ts
export interface PostgrestLogEntry {
  id: string
  timestamp: string
  service_name: 'postgrest'
  method: string
  path: string
  host: string
  status_code: string
  level: 'success' | 'warning' | 'error'
  response_time_ms?: number
  auth_user?: string | null
  api_role?: string | null
  service_specific_data: {
    query_string?: string
    content_type?: string
    accept?: string
    prefer?: string
    range?: string
    response_content_type?: string
    response_content_range?: string
    user_agent?: string
    cf_connecting_ip?: string
    cf_country?: string
    cf_ray?: string
  }
}

export interface ServiceFlowData {
  flowType: 'postgrest' | 'unsupported'
  selectedLog: ColumnSchema
  totalLogs: number
  postgrestLogs: PostgrestLogEntry[]
  message?: string
}
```

### 5. Update DataTableSheetContent to include service flow

```typescript
// In DataTableSheetContent.tsx
interface DataTableSheetContentProps<TData, TMeta> {
  // ... existing props
  serviceFlowData?: ServiceFlowData
  isServiceFlowLoading?: boolean
}

export function DataTableSheetContent<TData, TMeta>({
  data,
  table,
  className,
  fields,
  filterFields,
  metadata,
  serviceFlowData,
  isServiceFlowLoading,
  ...props
}: DataTableSheetContentProps<TData, TMeta>) {

  // Show service flow for /rest/ requests
  const isRestRequest = data?.path?.includes('/rest/')

  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList>
        <TabsTrigger value="details">Details</TabsTrigger>
        {isRestRequest && <TabsTrigger value="service-flow">Service Flow</TabsTrigger>}
      </TabsList>

      <TabsContent value="details">
        <dl className={cn('divide-y', className)} {...props}>
          {/* ... existing field rendering logic */}
        </dl>
      </TabsContent>

      {isRestRequest && (
        <TabsContent value="service-flow">
          <ServiceFlowPanel
            serviceFlowData={serviceFlowData}
            isLoading={isServiceFlowLoading || false}
          />
        </TabsContent>
      )}
    </Tabs>
  )
}
```

## Query Details

The PostgREST service flow query:

1. **Fetches enriched edge log data** for `/rest/` requests
2. **Uses time window correlation** (±5 seconds) to find related logs
3. **Bundles service-specific metadata** in a structured JSON format

### PostgREST-Specific Data:

- **Request headers**: `content-type`, `accept`, `prefer`, `range`
- **Response headers**: `content-type`, `content-range`
- **Network data**: Cloudflare country, IP, ray ID
- **Auth context**: User ID and role from JWT

### Correlation Strategy:

- **Path matching** - Exact pathname match
- **Time window** - ±5 seconds around the selected log
- **PostgREST filtering** - Only `/rest/` paths

This provides a comprehensive view of PostgREST requests with all the context needed for debugging API issues, performance analysis, and security monitoring!
