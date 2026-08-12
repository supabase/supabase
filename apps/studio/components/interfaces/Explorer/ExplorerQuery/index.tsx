import React from 'react'
import { cn } from 'ui'

const explorerQueryClassName = 'flex flex-col overflow-hidden bg-muted'

export type ExplorerQueryProps = React.ComponentProps<'div'>

/**
 * Framed Explorer query shell for notebooks and other embedded surfaces.
 * The consuming surface owns the height; results fill whatever the toolbar,
 * editor, and footer leave behind. The minimum height keeps the frame usable
 * when a surface leaves the height to content.
 */
const ExplorerQuery = ({ className, ...props }: ExplorerQueryProps) => (
  <div
    data-slot="explorer-query"
    data-variant="embedded"
    className={cn(explorerQueryClassName, 'min-h-64 rounded-md border shadow-xs', className)}
    {...props}
  />
)
ExplorerQuery.displayName = 'ExplorerQuery'

export type ExplorerQueryViewportProps = React.ComponentProps<'div'>

/**
 * Full-height Explorer query shell for a dedicated tab or another viewport.
 * Fills its container so the surrounding page decides the height.
 */
const ExplorerQueryViewport = ({ className, ...props }: ExplorerQueryViewportProps) => (
  <div
    data-slot="explorer-query"
    data-variant="viewport"
    className={cn(explorerQueryClassName, 'h-full min-h-0', className)}
    {...props}
  />
)
ExplorerQueryViewport.displayName = 'ExplorerQueryViewport'

export type ExplorerQueryEditorProps = React.ComponentProps<'div'>

/** Region containing the editable or read-only SQL editor supplied by the caller. */
const ExplorerQueryEditor = ({ className, ...props }: ExplorerQueryEditorProps) => (
  <div
    data-slot="explorer-query-editor"
    className={cn('min-h-20 shrink-0 overflow-hidden border-b', className)}
    {...props}
  />
)
ExplorerQueryEditor.displayName = 'ExplorerQueryEditor'

export type ExplorerQueryResultsProps = React.ComponentProps<'div'>

/**
 * Always-present result region for idle, loading, error, table, or chart content.
 * Fills the height left by the toolbar, editor, and footer, and shrinks rather
 * than pushing them out of the frame. Content that can overflow supplies its own
 * scroll container.
 */
const ExplorerQueryResults = ({ className, ...props }: ExplorerQueryResultsProps) => (
  <div
    data-slot="explorer-query-results"
    className={cn('flex min-h-0 w-full flex-1 flex-col overflow-hidden', className)}
    {...props}
  />
)
ExplorerQueryResults.displayName = 'ExplorerQueryResults'

export type ExplorerQueryFooterProps = React.ComponentProps<'div'>

/** Optional metadata or surface-specific content below the results region. */
const ExplorerQueryFooter = ({ className, ...props }: ExplorerQueryFooterProps) => (
  <div
    data-slot="explorer-query-footer"
    className={cn('shrink-0 border-t px-3 py-1 text-xs text-foreground-lighter', className)}
    {...props}
  />
)
ExplorerQueryFooter.displayName = 'ExplorerQueryFooter'

export type {
  QueryDisplay,
  QueryResultChartConfig,
  QueryResultColumn,
  QueryResultData,
  QueryResultRow,
  QueryResultState,
  QueryResultTableConfig,
} from './ExplorerQuery.types'

export {
  ExplorerQuery,
  ExplorerQueryEditor,
  ExplorerQueryFooter,
  ExplorerQueryResults,
  ExplorerQueryViewport,
}
