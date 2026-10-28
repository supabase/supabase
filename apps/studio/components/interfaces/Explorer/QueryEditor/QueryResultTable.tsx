import { useState } from 'react'

import type { QueryResult } from '../types'
import { QueryResultRowEditor } from './QueryResultRowEditor'
import type { QueryResultEditing } from './useQueryResultEditing'
import { CellEditQueueProvider } from '@/components/grid/context/CellEditQueueContext'
import { getColumnCellEditor } from '@/components/grid/utils/gridColumns'
import { JsonEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/JsonEditor'
import { TextEditor } from '@/components/interfaces/TableGridEditor/SidePanelEditor/RowEditor/TextEditor'
import { DataGridResults, type ResultCellEditor } from '@/components/ui/DataGridResults'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

type ResultRow = Record<string, unknown>

type ExpandedCell = { type: 'json' | 'text'; column: string; row: ResultRow }

export const QueryResultTable = ({
  result,
  editing,
}: {
  result: QueryResult
  editing: QueryResultEditing
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { target, canEdit } = editing
  const [selection, setSelection] = useState<{ result: QueryResult; row: ResultRow }>()
  const [expandedCell, setExpandedCell] = useState<ExpandedCell>()

  const selectedRow = selection?.result === result ? selection.row : undefined
  const selectedIdentifiers = selectedRow ? editing.getRowIdentifiers(selectedRow) : null
  const roleImpersonationState = result.editingContext?.roleImpersonationState

  const cellEditors: Record<string, ResultCellEditor | undefined> = {}
  if (canEdit && target) {
    for (const { name, column } of target.columns) {
      const supaColumn = editing.columns.find((candidate) => candidate.name === column)
      if (!supaColumn) continue
      cellEditors[name] = getColumnCellEditor(supaColumn, {
        onExpandJSONEditor: (column, row) => setExpandedCell({ type: 'json', column, row }),
        onExpandTextEditor: (column, row) => setExpandedCell({ type: 'text', column, row }),
      })
    }
  }

  const handleSaveExpandedCell = (value: unknown) => {
    if (expandedCell) editing.stageCellEdit(expandedCell.row, expandedCell.column, value)
    setExpandedCell(undefined)
  }

  return (
    <CellEditQueueProvider value>
      <DataGridResults
        rows={editing.rows}
        reserveRowActions={result.source === 'database'}
        isLoadingRowActions={editing.isLoadingTarget}
        onEditRow={canEdit ? (row) => setSelection({ result, row }) : undefined}
        canEditRow={target ? (row) => !!editing.getRowIdentifiers(row) : undefined}
        cellEditors={cellEditors}
        onCellChange={canEdit ? editing.stageCellEdit : undefined}
        isCellDirty={editing.pendingEdits.length > 0 ? editing.isCellEdited : undefined}
      />

      {canEdit && target && selectedIdentifiers && project && (
        <QueryResultRowEditor
          projectRef={project.ref}
          connectionString={project.connectionString}
          table={target.table}
          identifiers={selectedIdentifiers}
          pendingEdits={editing.pendingEdits}
          roleImpersonationState={roleImpersonationState}
          onClose={() => setSelection(undefined)}
          onStage={(row, changes) => {
            editing.stageRowEdits(selectedIdentifiers, row, changes)
            setSelection(undefined)
          }}
        />
      )}

      <TextEditor
        visible={expandedCell?.type === 'text'}
        tableId={target?.table.id}
        roleImpersonationState={roleImpersonationState}
        column={expandedCell?.column ?? ''}
        row={expandedCell?.row ?? {}}
        closePanel={() => setExpandedCell(undefined)}
        onSaveField={(value, resolve) => {
          handleSaveExpandedCell(value)
          resolve()
        }}
      />
      <JsonEditor
        visible={expandedCell?.type === 'json'}
        tableId={target?.table.id}
        roleImpersonationState={roleImpersonationState}
        column={expandedCell?.column ?? ''}
        row={expandedCell?.row ?? {}}
        backButtonLabel="Cancel"
        applyButtonLabel="Queue changes"
        closePanel={() => setExpandedCell(undefined)}
        onSaveJSON={(value, resolve) => {
          handleSaveExpandedCell(value === null ? null : JSON.parse(String(value)))
          resolve()
        }}
      />
    </CellEditQueueProvider>
  )
}
