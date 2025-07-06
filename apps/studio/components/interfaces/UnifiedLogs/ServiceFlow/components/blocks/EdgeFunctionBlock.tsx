import { memo } from 'react'
import { ServiceFlowBlockProps } from '../../types'
import { TimelineStep } from '../shared/TimelineStep'
import { BlockField } from '../shared/BlockField'
import { CollapsibleSection } from '../shared/CollapsibleSection'
import {
  edgeFunctionPrimaryFields,
  edgeFunctionDetailsFields,
} from '../../config/serviceFlowFields'

// Debug flag for console logs - set to true for debugging
const DEBUG_SERVICE_FLOW = false

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
      <TimelineStep title="Edge Function">
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
                const message = log.event_message || ''
                const maxLength = 100 // Maximum characters for log message
                const isTruncated = message.length > maxLength
                const truncatedMessage = isTruncated ? message.slice(0, maxLength) + '...' : message

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
                      <span
                        className="text-foreground text-xs font-mono flex-1"
                        title={isTruncated ? message : undefined}
                      >
                        {truncatedMessage}
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

export const MemoizedEdgeFunctionBlock = memo(EdgeFunctionBlock, (prev, next) => {
  return (
    prev.data === next.data &&
    prev.enrichedData === next.enrichedData &&
    prev.isLoading === next.isLoading &&
    prev.filterFields === next.filterFields &&
    prev.table === next.table
  )
}) as typeof EdgeFunctionBlock
