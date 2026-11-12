import type { LogSettings, Project, Row } from '@supabase/mcp-server-supabase/apps'
import { ScrollTextIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { errorMessage, type AskAgent, type Loadable, type SelectionSharing } from '../common'
import { LogDetailPanel } from './log-detail-panel'
import { LogList, type SelectModifiers } from './log-list'
import { selectLogRows, type LogRowSelection } from './log-selection'
import {
  filterLogEntries,
  logSelectionContext,
  toLogEntries,
  type LogLevelFilter,
} from './logs-model'
import { LogsToolbar } from './logs-toolbar'

export interface LogsViewProps {
  project: Project
  enabled: boolean
  /** False while the view is mounted but hidden; selection and attachments are cleared. */
  active?: boolean
  settings: LogSettings
  onSettingsChange: (settings: LogSettings) => void
  /** The host's read of logs for `settings` (search is applied locally). */
  logs: Loadable<Row[]>
  onRefresh?: () => void
  /** Shares selected logs with the agent as context. Omit when the host cannot. */
  selectionSharing?: SelectionSharing
  /** Sends an investigation request with the selection. Omit when the host cannot. */
  onAsk?: AskAgent
  /** Names the agent in actions, e.g. "Send to Codex". */
  agentName: string
}

type Selection = LogRowSelection & { key: unknown; focusId: string | null }

const emptySelection = (key: unknown): Selection => ({
  key,
  selected: [],
  anchor: null,
  focusId: null,
})

function emptyMessage(search: string, level: LogLevelFilter) {
  if (search) return `No loaded logs match “${search}”.`
  if (level === 'all') return 'No logs in the selected time range.'
  return `No ${level} logs in the selected time range.`
}

export function LogsView(props: LogsViewProps) {
  if (!props.enabled) {
    return (
      <div className="p-4">
        <EmptyStatePresentational
          icon={ScrollTextIcon}
          title="Logs are unavailable"
          description="Enable the debugging feature on a server with unified logs support to view project logs."
        />
      </div>
    )
  }
  return <EnabledLogsView {...props} />
}

function EnabledLogsView({
  project,
  active = true,
  settings,
  onSettingsChange,
  logs,
  onRefresh,
  selectionSharing,
  onAsk,
  agentName,
}: LogsViewProps) {
  const { search, source = 'all', level = 'all', minutes } = settings
  const isLoading = logs.status === 'loading'
  const rows = logs.status === 'success' ? logs.data : undefined
  const loaded = useMemo(() => (rows ? toLogEntries(rows) : undefined), [rows])
  // Memoized for a stable selection attachment: a new object would re-attach on every render.
  const visible = useMemo(
    () => (loaded ? filterLogEntries(loaded, { search, level }) : []),
    [loaded, search, level]
  )

  // Any change to what is loaded, filtered or shown starts a fresh selection.
  const selectionKey = useMemo(() => ({ logs, search, active }), [logs, search, active])
  const [selection, setSelection] = useState<Selection>(() => emptySelection(selectionKey))
  if (selection.key !== selectionKey) setSelection(emptySelection(selectionKey))
  const clearSelection = () => setSelection(emptySelection(selectionKey))

  const chosen = useMemo(
    () => visible.filter((log) => selection.selected.includes(log.id)),
    [visible, selection.selected]
  )
  const shared = useMemo(() => logSelectionContext(chosen, project.id), [chosen, project.id])
  const attachment = shared.status === 'ready' ? shared.attachment : undefined

  const [attachError, setAttachError] = useState<{ for: object; message: string }>()
  useEffect(() => {
    if (!selectionSharing || !attachment || !active) return
    let isCurrent = true
    selectionSharing.attach(attachment).catch((error: unknown) => {
      if (isCurrent) setAttachError({ for: attachment, message: errorMessage(error) })
    })
    return () => {
      isCurrent = false
      selectionSharing.detach(attachment).catch(() => {})
    }
  }, [selectionSharing, attachment, active])

  const [isAsking, setIsAsking] = useState(false)
  const [askError, setAskError] = useState<{ for: object; message: string }>()
  const canAsk = !!onAsk && !isAsking

  async function handleAsk() {
    if (!onAsk || isAsking) return
    setAskError(undefined)
    if (!attachment) return
    setIsAsking(true)
    try {
      await onAsk({ type: 'investigate-logs', project, attachment })
    } catch (error) {
      setAskError({ for: shared, message: errorMessage(error) })
    } finally {
      setIsAsking(false)
    }
  }

  function handleSelect(id: string, modifiers: SelectModifiers = {}) {
    const ids = visible.map((log) => log.id)
    const next = selectLogRows(ids, selection.selected, selection.anchor, id, modifiers)
    setSelection({ key: selectionKey, ...next, focusId: id })
  }

  function handleSelectAll(anchorId: string) {
    setSelection({
      key: selectionKey,
      selected: visible.map((log) => log.id),
      anchor: anchorId,
      focusId: anchorId,
    })
  }

  // Errors belong to the selection that caused them and disappear when it changes.
  const visibleAttachError =
    attachError && attachError.for === attachment ? attachError.message : undefined
  const visibleAskError = askError && askError.for === shared ? askError.message : undefined
  const tooLargeMessage = shared.status === 'too-large' ? shared.message : undefined
  const loadError = logs.status === 'error' ? logs.message : undefined

  return (
    <section aria-label="Project logs" className="flex min-h-0 min-w-0 flex-1 flex-col">
      <LogsToolbar
        search={search}
        level={level}
        source={source}
        minutes={minutes}
        isLoading={isLoading}
        onSearchChange={(value) => onSettingsChange({ ...settings, search: value })}
        onLevelChange={(value) => onSettingsChange({ ...settings, level: value })}
        onSourceChange={(value) => onSettingsChange({ ...settings, source: value })}
        onMinutesChange={(value) => onSettingsChange({ ...settings, minutes: value })}
        onRefresh={onRefresh}
      />
      {(tooLargeMessage || visibleAttachError || visibleAskError || loadError) && (
        <div className="flex flex-col gap-2 px-3 pt-2">
          {tooLargeMessage && (
            <Admonition type="warning" title="Selection too large" description={tooLargeMessage} />
          )}
          {!tooLargeMessage && visibleAttachError && (
            <Admonition
              type="destructive"
              title={`Failed to share logs with ${agentName}`}
              description={visibleAttachError}
            />
          )}
          {!tooLargeMessage && !visibleAttachError && visibleAskError && (
            <Admonition
              type="destructive"
              title={`Failed to send logs to ${agentName}`}
              description={visibleAskError}
            />
          )}
          {loadError && (
            <Admonition
              type="warning"
              title="Failed to load logs"
              description={`Error: ${loadError}`}
              actions={
                onRefresh && (
                  <Button variant="default" size="tiny" onClick={onRefresh}>
                    Retry
                  </Button>
                )
              }
            />
          )}
        </div>
      )}
      <div className="@container flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col @3xl:flex-row">
          <LogList
            logs={visible}
            selectedIds={selection.selected}
            focusId={selection.focusId}
            isLoading={isLoading}
            emptyMessage={loadError ? 'Logs could not be loaded.' : emptyMessage(search, level)}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onClear={clearSelection}
            onFocusRow={(id) => setSelection((current) => ({ ...current, focusId: id }))}
          />
          {chosen.length > 0 && (
            <LogDetailPanel
              logs={chosen}
              agentName={agentName}
              canAsk={canAsk}
              isAsking={isAsking}
              onAsk={() => void handleAsk()}
              onClose={clearSelection}
            />
          )}
        </div>
      </div>
    </section>
  )
}
