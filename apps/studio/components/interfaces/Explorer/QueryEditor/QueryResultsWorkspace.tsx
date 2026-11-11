import { PanelRightIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, cn, ResizableHandle, ResizablePanel, ResizablePanelGroup } from 'ui'

import { ExplorerToolbarAction } from '../ExplorerToolbar'
import type { QueryResult } from '../types'
import { AddRowButton } from './AddRowButton'
import { PendingChangesPanel } from './PendingChangesPanel'
import { QueryDetailsPanel } from './QueryDetailsPanel'
import { QueryResultEditsBar } from './QueryResultEditsBar'
import { QueryResultRowEditor } from './QueryResultRowEditor'
import type { ResultRowSelection } from './QueryResultTable'
import { RowDetailsPanel } from './RowDetailsPanel'
import { useQueryResultEditing } from './useQueryResultEditing'
import { useExplorerPreferences } from '@/components/interfaces/Account/Preferences/useExplorerPreferences'
import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import type { RoleImpersonationState } from '@/lib/role-impersonation'

type ResultRow = Record<string, unknown>

/**
 * What a full Explorer tab does with a database result, whoever produced it: edit it in place,
 * describe the objects and rows behind it in a sidebar, review edits before saving, and add
 * rows to its table. A query tab and a table tab share this, so rows behave the same in both.
 */
export function useQueryResultsWorkspace({
  result,
  onResultChange,
  isEditingEnabled,
  roleImpersonationState,
  hasSidebar,
}: {
  result?: QueryResult
  onResultChange: (result: QueryResult) => void
  /** False while the surface is read-only or busy, which pauses editing but keeps the edits. */
  isEditingEnabled: boolean
  roleImpersonationState?: RoleImpersonationState
  /** Whether there's room for the details sidebar, i.e. the results fill a tab. */
  hasSidebar: boolean
}) {
  const editing = useQueryResultEditing({
    result,
    isEnabled: isEditingEnabled,
    roleImpersonationState,
    onResultChange,
  })

  const { showDetails, setShowDetails } = useExplorerPreferences()
  const hasPendingEdits = editing.pendingEdits.length > 0
  const [isReviewRequested, setIsReviewRequested] = useState(false)
  // Once the edits are saved or discarded there's nothing left to review, so the next edit
  // starts with the sidebar as the user had it rather than reopening the review.
  const [hadPendingEdits, setHadPendingEdits] = useState(hasPendingEdits)
  if (hadPendingEdits !== hasPendingEdits) {
    setHadPendingEdits(hasPendingEdits)
    if (!hasPendingEdits) setIsReviewRequested(false)
  }
  const isReviewingChanges = hasSidebar && isReviewRequested && hasPendingEdits
  const isDetailsOpen = hasSidebar && showDetails && !isReviewingChanges

  // The row the details describe, named by primary key so it survives edits and re-runs; once
  // a result no longer has it, the details fall back to the table.
  const [selectedRowKey, setSelectedRowKey] = useState<{
    tableId: number
    rowIdentifiers: Record<string, unknown>
  }>()
  const [isRowEditorOpen, setIsRowEditorOpen] = useState(false)
  const target = editing.target
  const selectedRow =
    selectedRowKey && target?.table.id === selectedRowKey.tableId
      ? editing.findRow(selectedRowKey.rowIdentifiers)
      : undefined

  const handleSelectedRowChange = (row: ResultRow | undefined) => {
    const rowIdentifiers = row ? editing.getRowIdentifiers(row) : null
    setSelectedRowKey(
      rowIdentifiers && target ? { tableId: target.table.id, rowIdentifiers } : undefined
    )
  }

  const rowSelection: ResultRowSelection | undefined = hasSidebar
    ? {
        selectedRow: isDetailsOpen ? selectedRow : undefined,
        onSelectedRowChange: handleSelectedRowChange,
        onViewRow: (row) => {
          handleSelectedRowChange(row)
          setIsReviewRequested(false)
          setShowDetails(true)
        },
      }
    : undefined

  return {
    editing,
    result,
    hasSidebar,
    hasPendingEdits,
    isDetailsOpen,
    isReviewingChanges,
    rowSelection,
    selectedRow,
    selectedRowKey,
    clearSelectedRow: () => setSelectedRowKey(undefined),
    isRowEditorOpen,
    setIsRowEditorOpen,
    toggleDetails: () => {
      setIsReviewRequested(false)
      setShowDetails(!isDetailsOpen)
    },
    toggleReview: () => setIsReviewRequested(!isReviewingChanges),
  }
}

export type QueryResultsWorkspaceState = ReturnType<typeof useQueryResultsWorkspace>

/** Toggles the details sidebar. */
export const QueryResultsDetailsToggle = ({
  workspace,
}: {
  workspace: QueryResultsWorkspaceState
}) =>
  workspace.hasSidebar ? (
    <ExplorerToolbarAction
      icon={<PanelRightIcon size={16} strokeWidth={2} />}
      aria-label={workspace.isDetailsOpen ? 'Hide details' : 'Show details'}
      aria-pressed={workspace.isDetailsOpen}
      tooltip={workspace.isDetailsOpen ? 'Hide details' : 'Show details'}
      className={cn(workspace.isDetailsOpen && 'text-foreground')}
      onClick={workspace.toggleDetails}
    />
  ) : null

/**
 * The result's main actions, for the end of a toolbar: adding a row to the table it comes from,
 * set apart from the icon actions, and reviewing unsaved edits once there are some.
 */
export const QueryResultsPrimaryActions = ({
  workspace,
  canAddRow,
}: {
  workspace: QueryResultsWorkspaceState
  /** False where the surface can't change rows right now, e.g. while it runs. */
  canAddRow: boolean
}) => {
  const { editing, hasSidebar, hasPendingEdits, isReviewingChanges } = workspace
  const target = editing.target

  return (
    <>
      {canAddRow && hasSidebar && target && (
        <AddRowButton
          className="ml-2"
          relation={{
            id: target.table.id,
            schema: target.table.schema,
            name: target.table.name,
            type: ENTITY_TYPE.TABLE,
          }}
          onRowAdded={(row) => editing.addRow(target.table.id, row)}
        />
      )}

      {hasSidebar && hasPendingEdits && (
        <Button
          variant={isReviewingChanges ? 'default' : 'outline'}
          size="tiny"
          className="mx-1"
          aria-pressed={isReviewingChanges}
          onClick={workspace.toggleReview}
        >
          Review changes
        </Button>
      )}
    </>
  )
}

/**
 * Lays out results with their footer and, in a full tab, the details sidebar beside them. While
 * edits are pending the footer gives way to the bar that saves or discards them.
 */
export const QueryResultsWorkspace = ({
  workspace,
  detailsSql,
  footer,
  isShortcutEnabled,
  children,
}: {
  workspace: QueryResultsWorkspaceState
  /** The SQL whose tables and views the sidebar describes, usually the one that ran. */
  detailsSql?: string
  footer: ReactNode
  /** Whether the edits bar's save shortcut applies, i.e. this is the focused tab. */
  isShortcutEnabled: boolean
  children: ReactNode
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { editing, result, selectedRow, selectedRowKey, isDetailsOpen, isReviewingChanges } =
    workspace
  const target = editing.target

  const body = (
    <>
      {children}
      {workspace.hasPendingEdits ? (
        <QueryResultEditsBar editing={editing} isShortcutEnabled={isShortcutEnabled} />
      ) : (
        footer
      )}
    </>
  )

  const selectedRowDetails =
    selectedRow && selectedRowKey && target
      ? {
          relation: {
            id: target.table.id,
            schema: target.table.schema,
            name: target.table.name,
            type: ENTITY_TYPE.TABLE,
          },
          row: selectedRow,
          rowIdentifiers: selectedRowKey.rowIdentifiers,
        }
      : undefined

  return (
    <>
      {workspace.hasSidebar ? (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel id="explorer-query-main">
            <div className="flex h-full min-h-0 min-w-0 flex-col">{body}</div>
          </ResizablePanel>
          {(isReviewingChanges || isDetailsOpen) && (
            <>
              <ResizableHandle withHandle />
              {/* Same bounds as the Explorer sidebar on the other side. */}
              <ResizablePanel
                id="explorer-query-sidebar"
                minSize={256}
                maxSize={512}
                defaultSize={288}
              >
                {isReviewingChanges && <PendingChangesPanel editing={editing} />}
                {isDetailsOpen && selectedRowDetails && (
                  <RowDetailsPanel
                    {...selectedRowDetails}
                    onBack={workspace.clearSelectedRow}
                    onRowDeleted={() => {
                      editing.removeRow(selectedRowDetails.rowIdentifiers)
                      workspace.clearSelectedRow()
                    }}
                    onEdit={editing.canEdit ? () => workspace.setIsRowEditorOpen(true) : undefined}
                  />
                )}
                {isDetailsOpen && !selectedRowDetails && <QueryDetailsPanel sql={detailsSql} />}
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      ) : (
        body
      )}

      {workspace.isRowEditorOpen && editing.canEdit && target && selectedRowKey && project && (
        <QueryResultRowEditor
          projectRef={project.ref}
          connectionString={project.connectionString}
          table={target.table}
          identifiers={selectedRowKey.rowIdentifiers}
          pendingEdits={editing.pendingEdits}
          roleImpersonationState={result?.editingContext?.roleImpersonationState}
          onClose={() => workspace.setIsRowEditorOpen(false)}
          onStage={(row, changes) => {
            editing.stageRowEdits(selectedRowKey.rowIdentifiers, row, changes)
            workspace.setIsRowEditorOpen(false)
          }}
        />
      )}
    </>
  )
}
