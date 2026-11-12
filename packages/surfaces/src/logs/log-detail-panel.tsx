import { CheckIcon, CopyIcon, SendIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { copyToClipboard } from 'ui'

import { ExplorerToolbarAction } from '../explorer/explorer-toolbar'
import type { LogEntry } from './logs-model'

interface LogDetailPanelProps {
  logs: LogEntry[]
  agentName: string
  canAsk: boolean
  isAsking: boolean
  onAsk: () => void
  onClose: () => void
}

function detailFields(log: LogEntry) {
  return [
    ['Time', log.time],
    ['Source', log.source],
    ['Level', log.level.toLowerCase()],
    ['Status', log.status],
    ['Method', log.method],
    ['Path', log.path],
    ['Message', log.message],
  ].filter(([, value]) => value !== '')
}

/** An inset panel beside the list: one log's fields, or the raw rows of a multi-selection. */
export function LogDetailPanel({
  logs,
  agentName,
  canAsk,
  isAsking,
  onAsk,
  onClose,
}: LogDetailPanelProps) {
  const isSingle = logs.length === 1
  const title = isSingle ? logs[0].source : `${logs.length} logs`
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')

  // Hosts may have no toast, so the button itself confirms the copy for a moment.
  useEffect(() => {
    if (copyState === 'idle') return
    const timer = setTimeout(() => setCopyState('idle'), 2000)
    return () => clearTimeout(timer)
  }, [copyState])

  function handleCopy() {
    const text = JSON.stringify(isSingle ? logs[0].raw : logs.map(({ raw }) => raw), null, 2)
    // Never await before copying: Safari requires the write inside the click.
    copyToClipboard(text, () => setCopyState('copied')).catch(() => setCopyState('failed'))
  }

  return (
    <aside
      aria-label="Log details"
      className="m-2 flex max-h-[50%] min-h-0 shrink-0 flex-col overflow-hidden rounded-lg border bg-surface-100 @3xl:max-h-none @3xl:w-72 @3xl:min-w-60"
    >
      <header className="flex h-10 shrink-0 items-center gap-1 border-b px-3">
        <h2 className="flex-1 truncate text-sm text-foreground">{title}</h2>
        <ExplorerToolbarAction
          icon={
            copyState === 'copied' ? (
              <CheckIcon size={16} strokeWidth={2} />
            ) : (
              <CopyIcon size={16} strokeWidth={2} />
            )
          }
          tooltip={
            copyState === 'copied'
              ? 'Copied'
              : copyState === 'failed'
                ? 'Copy failed'
                : 'Copy logs as JSON'
          }
          onClick={handleCopy}
        />
        <ExplorerToolbarAction
          icon={<SendIcon size={16} strokeWidth={2} />}
          tooltip={`Send to ${agentName}`}
          disabled={!canAsk}
          loading={isAsking}
          aria-description="Send the selected logs to the agent to investigate."
          onClick={onAsk}
        />
        <ExplorerToolbarAction
          icon={<XIcon size={16} strokeWidth={2} />}
          tooltip="Close log details"
          onClick={onClose}
        />
      </header>
      <div className="min-h-0 overflow-auto px-3 py-4">
        {isSingle ? (
          <dl className="flex flex-col gap-y-2.5 text-xs leading-relaxed">
            {detailFields(logs[0]).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[55px_minmax(0,1fr)] gap-3">
                <dt className="text-foreground-light">{key}</dt>
                <dd className="whitespace-pre-wrap break-words text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <pre
            aria-label="Selected log metadata"
            className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-foreground"
          >
            {JSON.stringify(
              logs.map(({ raw }) => raw),
              null,
              2
            )}
          </pre>
        )}
      </div>
    </aside>
  )
}
