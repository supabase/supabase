import {
  Button,
  cn,
  CodeBlock,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from 'ui'
import type { PreviewLogData, LogSearchCallback } from '../Logs.types'
import { toast } from 'sonner'
import { TimestampInfo } from 'ui-patterns'
import { useState, useEffect } from 'react'
import { ResponseCodeFormatter } from '../LogsFormatters'
import { useLogsUrlState } from 'hooks/analytics/useLogsUrlState'

const LogRowSeparator = () => <Separator className="bg-border my-1" />

const PropertyRow = ({
  keyName,
  value,
  dataTestId,
}: {
  keyName: string
  value: any
  dataTestId?: string
}) => {
  const { search, setSearch } = useLogsUrlState()
  const handleSearch: LogSearchCallback = async (event: string, { query }: { query?: string }) => {
    setSearch(query || '')
  }

  const isTimestamp =
    keyName === 'timestamp' || keyName === 'created_at' || keyName === 'updated_at'
  const isObject = typeof value === 'object' && value !== null
  const isStatus = keyName === 'status' || keyName === 'status_code'
  const isMethod = keyName === 'method'
  const isPath = keyName === 'path'
  const isUserAgent = keyName === 'user_agent'

  const storageKey = `log-viewer-expanded-${keyName}`
  const [isExpanded, setIsExpanded] = useState(() => {
    try {
      // Storing in local storage so users dont have to click expand every time they change selected log
      return JSON.parse(localStorage.getItem(storageKey) ?? 'false')
    } catch (_) {
      return false
    }
  })
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(isExpanded))
  }, [isExpanded, storageKey])

  const handleCopy = () => {
    copyToClipboard(String(value), () => {
      setIsCopied(true)
      toast.success('Copied to clipboard')
    })

    setTimeout(() => {
      setIsCopied(false)
    }, 1000)
  }

  if (isObject) {
    return (
      <>
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground-lighter text-sm pl-3 py-2">{keyName}</h3>
          <div>
            <CodeBlock
              hideLineNumbers
              className={cn(
                '!bg-surface-300 w-full pt-1 max-w-full border-none text-xs prose-sm transition-all',
                {
                  'max-h-[80px]': !isExpanded,
                  'max-h-[400px]': isExpanded,
                }
              )}
              value={JSON.stringify(value, null, 2)}
              language="json"
            />
            <Button
              className="mt-1 w-full"
              size="tiny"
              type="outline"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
          </div>
        </div>
        <LogRowSeparator />
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="group w-full" data-testid={dataTestId}>
        <div className="rounded-md w-full overflow-hidden">
          <div
            className={cn('flex h-10 w-full', {
              'flex-col gap-1.5 h-auto': isExpanded,
              'items-center group-hover:bg-surface-300 gap-4': !isExpanded,
            })}
          >
            <h3
              className={cn('pl-3 text-foreground-lighter text-sm text-left', {
                'h-10 flex items-center': isExpanded,
              })}
            >
              {keyName}
            </h3>
            <div
              className={cn('text-xs flex-1 font-mono text-foreground pr-3', {
                'max-w-full text-left rounded-md p-2 bg-surface-300 text-xs w-full': isExpanded,
                'truncate text-right': !isExpanded,
                'text-brand-600': isCopied,
              })}
            >
              {isExpanded ? (
                <CodeBlock value={JSON.stringify(value, null, 2)} />
              ) : isTimestamp ? (
                <TimestampInfo className="text-sm" utcTimestamp={value} />
              ) : isStatus ? (
                <div className="flex items-center gap-1 justify-end">
                  <ResponseCodeFormatter value={value} />
                </div>
              ) : isMethod ? (
                <div className="flex items-center gap-1 justify-end">
                  <ResponseCodeFormatter value={value} />
                </div>
              ) : (
                <div className="truncate">{JSON.stringify(value)}</div>
              )}
            </div>
          </div>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={handleCopy}>Copy {keyName}</DropdownMenuItem>
        {!isObject && (
          <DropdownMenuItem
            onClick={() => {
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? 'Collapse' : 'Expand'} value
          </DropdownMenuItem>
        )}
        {(isPath || isMethod || isUserAgent || isStatus) && (
          <DropdownMenuItem
            onClick={() => {
              handleSearch('search-input-change', { query: value })
            }}
          >
            Search by {keyName}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
      <LogRowSeparator />
    </DropdownMenu>
  )
}

const DefaultPreviewSelectionRenderer = ({ log }: { log: PreviewLogData }) => {
  const { timestamp, event_message, metadata, id, status, ...rest } = log

  return (
    <div data-testid="log-selection" className={`p-2 flex flex-col`}>
      {log?.id && <PropertyRow key={'id'} keyName={'id'} value={log.id} />}
      {log?.status && <PropertyRow key={'status'} keyName={'status'} value={log.status} />}
      {log?.timestamp && (
        <PropertyRow
          dataTestId="log-selection-timestamp"
          key={'timestamp'}
          keyName={'timestamp'}
          value={log.timestamp}
        />
      )}
      {Object.entries(rest).map(([key, value]) => {
        return <PropertyRow key={key} keyName={key} value={value} />
      })}

      {log?.event_message && (
        <PropertyRow key={'event_message'} keyName={'event_message'} value={log.event_message} />
      )}
      {log?.metadata && <PropertyRow key={'metadata'} keyName={'metadata'} value={log.metadata} />}
    </div>
  )
}

export default DefaultPreviewSelectionRenderer
