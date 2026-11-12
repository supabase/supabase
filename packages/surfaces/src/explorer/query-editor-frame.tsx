import type { QueryDisplay, Row } from '@supabase/mcp-server-supabase/apps'
import { CodeSquareIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import { DisplaySettingsButton } from './display-settings-button'
import {
  ExplorerQuery,
  ExplorerQueryEditor,
  ExplorerQueryResults,
  ExplorerQueryViewport,
} from './explorer-query'
import {
  ExplorerToolbar,
  ExplorerToolbarAction,
  ExplorerToolbarActions,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from './explorer-toolbar'
import { QueryRunButton } from './query-run-button'

export interface QueryEditorFrameRun {
  isExecuting: boolean
  isDisabled: boolean
  /** Shows "Run selected" when the editor has a selection. */
  hasSelection: boolean
  onRun: () => void
  onRunSelected: () => void
}

export interface QueryEditorFrameProps {
  /** `viewport` owns a tab's content area with a resizable split; `embedded` sits in a notebook, chat or host. */
  variant: 'embedded' | 'viewport'
  title: string
  /** The toolbar icon, e.g. a table icon for a table's rows. Defaults to a query icon. */
  icon?: ReactNode
  /** Makes the title editable. */
  onTitleChange?: (title: string) => void
  titleClassName?: string
  showQuery: boolean
  onShowQueryChange: (showQuery: boolean) => void
  /** False for views with no editable SQL, such as a table tab: the query and its toggle never show. */
  hasQuery?: boolean
  /** Locks query visibility, e.g. while a suggested edit is under review. */
  isLocked?: boolean
  /** The SQL editor area. `isSplit` is true when it fills the top half of a resizable split. */
  editor: (layout: { isSplit: boolean }) => ReactNode
  /** Rendered above the editor, e.g. a rewrite banner. */
  editorHeader?: ReactNode
  /** The results area: idle, error, table or chart. */
  results: ReactNode
  footer: ReactNode
  /** Source controls such as the database/logs menu. */
  sourceControls?: ReactNode
  display?: QueryDisplay
  /** Columns and rows the display settings choose from. */
  displayResult?: { rows?: readonly Row[] }
  onDisplayChange?: (display: QueryDisplay) => void
  toolbarActions?: ReactNode
  /** Omit to hide the run button, e.g. while an external approval owns the run. */
  run?: QueryEditorFrameRun
  className?: string
}

/**
 * The query editor's chrome and layout, shared by Studio's Explorer and MCP Apps
 * hosts. It holds no query state and runs nothing: the consumer supplies the
 * editor, results and run handlers, and owns execution, sources and persistence.
 */
export function QueryEditorFrame({
  variant,
  title,
  icon,
  onTitleChange,
  titleClassName,
  showQuery: showQueryProp,
  onShowQueryChange,
  hasQuery = true,
  isLocked = false,
  editor,
  editorHeader,
  results,
  footer,
  sourceControls,
  display,
  displayResult,
  onDisplayChange,
  toolbarActions,
  run,
  className,
}: QueryEditorFrameProps) {
  const Shell = variant === 'viewport' ? ExplorerQueryViewport : ExplorerQuery
  const showQuery = hasQuery && showQueryProp
  const isSplit = variant === 'viewport' && showQuery
  const rows = displayResult?.rows ?? []
  const columns = Object.keys(rows[0] ?? {})

  const querySql = showQuery ? (
    <>
      {editorHeader}
      <ExplorerQueryEditor
        className={cn('relative', isSplit && 'h-full min-h-0 flex-1 border-b-0')}
      >
        {editor({ isSplit })}
      </ExplorerQueryEditor>
    </>
  ) : null

  const queryResults = (
    <ExplorerQueryResults className={cn(variant === 'embedded' ? 'max-h-80' : 'h-full')}>
      {results}
    </ExplorerQueryResults>
  )

  return (
    <Shell className={className}>
      <ExplorerToolbar className={cn(variant === 'viewport' && 'px-4')}>
        <ExplorerToolbarIcon>
          {icon ?? <CodeSquareIcon size={16} strokeWidth={2} />}
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle className={titleClassName} onSaveTitle={onTitleChange}>
          {title}
        </ExplorerToolbarTitle>
        <ExplorerToolbarActions>
          {sourceControls}
          {display && onDisplayChange && (
            <DisplaySettingsButton
              result={displayResult}
              display={display}
              columns={columns}
              disabled={rows.length === 0}
              onChange={onDisplayChange}
            />
          )}
          {hasQuery && (
            <ExplorerToolbarAction
              icon={
                showQuery ? (
                  <EyeOffIcon size={16} strokeWidth={2} />
                ) : (
                  <EyeIcon size={16} strokeWidth={2} />
                )
              }
              disabled={isLocked}
              aria-label={showQuery ? 'Hide query' : 'Show query'}
              tooltip={showQuery ? 'Hide query' : 'Show query'}
              onClick={() => onShowQueryChange(!showQuery)}
            />
          )}
          {toolbarActions}
          {run && (
            <QueryRunButton
              isExecuting={run.isExecuting}
              disabled={run.isDisabled}
              hasSelection={showQuery && run.hasSelection}
              onRun={run.onRun}
              onRunSelected={run.onRunSelected}
            />
          )}
        </ExplorerToolbarActions>
      </ExplorerToolbar>

      {isSplit && (
        <ResizablePanelGroup orientation="vertical" className="relative h-0 min-h-0 flex-1">
          <ResizablePanel defaultSize="40" maxSize="70">
            <div className="flex h-full min-h-0 flex-col overflow-hidden">{querySql}</div>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="60" maxSize="70">
            <div className="flex h-full min-h-0 flex-col overflow-hidden">{queryResults}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
      {!isSplit && (
        <>
          {querySql}
          {queryResults}
        </>
      )}

      {footer}
    </Shell>
  )
}
