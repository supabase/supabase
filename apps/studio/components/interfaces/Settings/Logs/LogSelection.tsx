import { MousePointerClick, X } from 'lucide-react'
import {
  Button,
  CodeBlock,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Tabs_Shadcn_,
  cn,
} from 'ui'
import DefaultPreviewSelectionRenderer from './LogSelectionRenderers/DefaultPreviewSelectionRenderer'
import type { LogData, QueryType } from './Logs.types'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

export interface LogSelectionProps {
  log?: LogData
  onClose: () => void
  queryType?: QueryType
  projectRef: string
  collectionName?: string
  isLoading: boolean
  error?: string | object
}

const LogSelection = ({ log, onClose, queryType, isLoading, error }: LogSelectionProps) => {
  const LogDetails = () => {
    if (error) return <LogErrorState error={error} />
    if (!log) return <LogDetailEmptyState />

    switch (queryType) {
      // case 'warehouse':
      //   return <WarehouseSelectionRenderer log={log} />
      case 'api':
        const status = log?.metadata?.[0]?.response?.[0]?.status_code
        const method = log?.metadata?.[0]?.request?.[0]?.method
        const path = log?.metadata?.[0]?.request?.[0]?.path
        const user_agent = log?.metadata?.[0]?.request?.[0]?.headers[0].user_agent
        const { id, metadata, timestamp, event_message, ...rest } = log

        const apiLog = {
          id,
          status,
          method,
          path,
          user_agent,
          timestamp,
          event_message,
          metadata,
          ...rest,
        }

        return <DefaultPreviewSelectionRenderer log={apiLog} />
      default:
        return <DefaultPreviewSelectionRenderer log={log} />
    }
  }

  return (
    <div className="relative flex h-full flex-grow flex-col overflow-y-scroll bg-surface-100 border-t">
      <div className="relative flex-grow flex flex-col h-full">
        <Tabs_Shadcn_ defaultValue="details" className="flex flex-col h-full">
          <TabsList_Shadcn_ className="px-2 pt-2">
            <TabsTrigger_Shadcn_ className="px-3" value="details">
              Details
            </TabsTrigger_Shadcn_>
            <TabsTrigger_Shadcn_ disabled={!log} className="px-3" value="raw">
              Raw
            </TabsTrigger_Shadcn_>
            <Button
              type="text"
              className="ml-auto absolute top-2 right-2 cursor-pointer transition hover:text-foreground h-6 w-6 px-0 py-0 flex items-center justify-center"
              onClick={onClose}
            >
              <X size={14} strokeWidth={2} className="text-foreground-lighter" />
            </Button>
          </TabsList_Shadcn_>
          <div className="flex-1 h-full">
            {isLoading ? (
              <div className="p-4">
                <GenericSkeletonLoader />
              </div>
            ) : (
              <>
                <TabsContent_Shadcn_ className="space-y-6 h-full" value="details">
                  <LogDetails />
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ value="raw">
                  <CodeBlock
                    hideLineNumbers
                    language="json"
                    className="prose w-full pt-0 max-w-full border-none"
                  >
                    {JSON.stringify(log, null, 2)}
                  </CodeBlock>
                </TabsContent_Shadcn_>
              </>
            )}
          </div>
        </Tabs_Shadcn_>
      </div>
    </div>
  )
}

export default LogSelection

function LogDetailEmptyState({
  title = 'Select an Event',
  message = 'Select an Event to view the complete JSON payload',
}: {
  title?: string
  message?: string
}) {
  return (
    <div
      className={cn(
        'flex h-full w-full flex-col items-center justify-center gap-2 overflow-y-scroll text-center transition-all px-4'
      )}
    >
      <div
        className={cn(
          'flex w-full max-w-sm flex-col items-center justify-center gap-6 text-center transition-all delay-300 duration-500'
        )}
      >
        <div className="relative flex h-4 w-32 items-center rounded border border-control px-2">
          <div className="h-0.5 w-2/3 rounded-full bg-surface-300"></div>
          <div className="absolute right-1 -bottom-4">
            <MousePointerClick size="24" strokeWidth={1} />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm text-foreground">{title}</h3>
          <p className="text-xs text-foreground-lighter">{message}</p>
        </div>
      </div>
    </div>
  )
}

function LogErrorState({ error }: { error?: string | object }) {
  return <pre>{JSON.stringify(error, null, 2)}</pre>
}
