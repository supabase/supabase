import { Service } from 'data/graphql/graphql'
import { useLogsUrlState } from 'hooks/analytics/useLogsUrlState'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Button,
  cn,
  copyToClipboard,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'

import { ErrorCodeDialog } from '../ErrorCodeDialog'
import type { LogSearchCallback, PreviewLogData } from '../Logs.types'
import { ResponseCodeFormatter } from '../LogsFormatters'

const LogRowCodeBlock = ({ value, className }: { value: string; className?: string }) => (
  <pre
    className={cn(
      'px-1 bg-surface-300 w-full pt-1 max-w-full border-none text-xs prose-sm transition-all overflow-auto rounded-md whitespace-pre-wrap',
      className
    )}
  >
    {JSON.stringify(value, null, 2)}
  </pre>
)

const LogRowSeparator = () => <Separator className="bg-border my-1" />

const PropertyRow = ({
  keyName,
  value,
  dataTestId,
  path,
}: {
  keyName: string
  value: any
  dataTestId?: string
  path?: string
}) => {
  const { setSearch } = useLogsUrlState()
  const [showErrorInfo, setShowErrorInfo] = useState(false)

  const service = path?.startsWith('/auth/') ? Service.Auth : undefined

  const handleSearch: LogSearchCallback = async (event: string, { query }: { query?: string }) => {
    setSearch(query || '')
  }

  const isTimestamp =
    keyName === 'timestamp' || keyName === 'created_at' || keyName === 'updated_at'
  const isObject = typeof value === 'object' && value !== null
  const isStatus = keyName === 'status' || keyName === 'status_code'
  const isMethod = keyName === 'method'
  const isSearch = keyName === 'search'
  const isUserAgent = keyName === 'user_agent'
  const isEventMessage = keyName === 'event_message'
  const isPath = keyName === 'path'

  function getSearchPairs() {
    if (isSearch && typeof value === 'string') {
      const str = value.startsWith('?') ? value.slice(1) : value
      return str.split('&').filter(Boolean)
    }
    return []
  }

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

  if (isObject || isEventMessage) {
    return (
      <>
        <div className="flex flex-col gap-1">
          <h3 className="text-foreground-lighter text-sm pl-3 py-2">{keyName}</h3>
          <div>
            <LogRowCodeBlock
              className={cn('px-2.5', {
                'max-h-[80px]': !isExpanded,
                'max-h-[400px]': isExpanded,
                'py-2': isEventMessage,
              })}
              value={value}
            />
            {!isEventMessage && (
              <Button
                className="mt-1 w-full"
                size="tiny"
                type="outline"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Collapse' : 'Expand'}
              </Button>
            )}
          </div>
        </div>
        <LogRowSeparator />
      </>
    )
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="group w-full" data-testid={dataTestId}>
          <div className="rounded-md w-full overflow-hidden">
            <div
              className={cn('flex h-[var(--header-height)] w-full', {
                'flex-col gap-1.5 h-auto': isExpanded,
                'items-center group-hover:bg-surface-300 gap-4': !isExpanded,
              })}
            >
              <h3
                className={cn('pl-3 text-foreground-lighter text-sm text-left', {
                  'h-[var(--header-height)] flex items-center': isExpanded,
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
                  <LogRowCodeBlock value={value} />
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
                  <div className="truncate">{value}</div>
                )}
              </div>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {keyName === 'error_code' && (
            <DropdownMenuItem
              onClick={() => {
                setShowErrorInfo(true)
              }}
            >
              More information
            </DropdownMenuItem>
          )}
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
          {(isMethod || isUserAgent || isStatus || isPath) && (
            <DropdownMenuItem
              onClick={() => {
                handleSearch('search-input-change', { query: value })
              }}
            >
              Search by {keyName}
            </DropdownMenuItem>
          )}
          {isSearch
            ? getSearchPairs().map((pair) => (
                <DropdownMenuItem
                  key={pair}
                  onClick={() => {
                    handleSearch('search-input-change', { query: pair })
                  }}
                >
                  Search by {pair}
                </DropdownMenuItem>
              ))
            : null}
        </DropdownMenuContent>
        <LogRowSeparator />
      </DropdownMenu>
      {keyName === 'error_code' && (
        <ErrorCodeDialog
          open={showErrorInfo}
          onOpenChange={setShowErrorInfo}
          errorCode={String(value)}
          service={service}
        />
      )}
    </>
  )
}

const DefaultPreviewSelectionRenderer = ({ log }: { log: PreviewLogData }) => {
  const { timestamp, event_message, metadata, id, status, ...rest } = log
  const path = typeof log.path === 'string' ? log.path : undefined
  const log_file = log?.metadata?.[0]?.log_file

  return (
    <div data-testid="log-selection" className={`p-2 flex flex-col`}>
      {log?.id && (
        <PropertyRow dataTestId="log-selection-id" key={'id'} keyName={'id'} value={log.id} />
      )}
      {log?.status && <PropertyRow key={'status'} keyName={'status'} value={log.status} />}
      {log?.timestamp && (
        <PropertyRow key={'timestamp'} keyName={'timestamp'} value={log.timestamp} />
      )}
      {Object.entries(rest).map(([key, value]) => {
        return <PropertyRow key={key} keyName={key} value={value} path={path} />
      })}

      {log?.event_message && (
        <PropertyRow key="event_message" keyName="event_message" value={log.event_message} />
      )}
      {!!log_file && <PropertyRow key="log_file" keyName="log_file" value={log_file} />}
      {log?.metadata && <PropertyRow key="metadata" keyName="metadata" value={log.metadata} />}
    </div>
  )
}

export default DefaultPreviewSelectionRenderer
