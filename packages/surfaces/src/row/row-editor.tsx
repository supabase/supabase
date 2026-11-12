import type { Row, Table } from '@supabase/mcp-server-supabase/apps'
import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { Button, Sheet, SheetContent, SheetHeader, SheetTitle } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { errorMessage } from '../common'
import { RowField } from './row-field'
import {
  buildRowValues,
  canEditColumn,
  initialRowDraft,
  isFieldChanged,
  isRowWritable,
  rowKey,
  type FieldDraft,
} from './row-values'

/**
 * A row change for the host to apply. Updates carry the values they replace so
 * the host's write can reject a conflicting edit.
 */
export type RowChange =
  | {
      kind: 'update'
      schema: string
      table: string
      key: Row
      values: Row
      previous: Row
    }
  | { kind: 'insert'; schema: string; table: string; values: Row }

/** Applies a change and resolves with the row as stored. */
export type SaveRow = (change: RowChange) => Promise<Row>

export interface RowEditorProps {
  table: Table
  /** The row to edit. Omit to insert a new row. */
  row?: Row
  close: () => void
  saved: (row: Row) => void
  onSave: SaveRow
  readOnly?: boolean
}

export interface RowEditorFormState {
  dirty: boolean
  busy: boolean
}

export interface RowEditorFormProps extends RowEditorProps {
  onStateChange?: (state: RowEditorFormState) => void
  cancelLabel?: string
  /** Wraps the form, e.g. in a side panel. `requestClose` asks before discarding edits. */
  container?: (form: ReactNode, state: { requestClose: () => void; busy: boolean }) => ReactNode
}

/** Side panel shell; the form also works without one in conversation panels. */
export function RowEditor(props: RowEditorProps) {
  return (
    <RowEditorForm
      {...props}
      container={(form, { requestClose, busy }) => (
        <Sheet
          open
          onOpenChange={(open) => {
            if (!open && !busy) requestClose()
          }}
        >
          <SheetContent
            size="lg"
            showClose={!busy}
            className="flex flex-col gap-0 p-0"
            aria-describedby={undefined}
          >
            <SheetHeader>
              <SheetTitle className="text-base">
                {props.row ? 'Edit' : 'Insert'} {props.table.name} row
              </SheetTitle>
            </SheetHeader>
            {form}
          </SheetContent>
        </Sheet>
      )}
    />
  )
}

export function RowEditorForm({
  table,
  row,
  close,
  saved,
  onSave,
  readOnly = false,
  onStateChange,
  cancelLabel = 'Cancel',
  container,
}: RowEditorFormProps) {
  const id = useId()
  const [initial] = useState(() => initialRowDraft(table, row))
  const [draft, setDraft] = useState(initial)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState('')
  const [isConfirmingDiscard, setIsConfirmingDiscard] = useState(false)
  const lock = useRef(false)

  const changedColumns = table.columns.filter((column) =>
    isFieldChanged(draft[column.name], initial[column.name])
  )
  const isDirty = changedColumns.length > 0
  const isWritable = isRowWritable(table, readOnly, row)

  // Lets a panel refuse refreshes while edits or a save are pending.
  useLayoutEffect(() => {
    onStateChange?.({ dirty: isDirty, busy: isBusy })
  }, [isDirty, isBusy, onStateChange])

  function handleFieldChange(name: string, value: Partial<FieldDraft>) {
    setDraft((current) => ({ ...current, [name]: { ...current[name], ...value } }))
  }

  async function submit() {
    if (lock.current || !isWritable) return
    lock.current = true
    setIsBusy(true)
    setError('')
    try {
      const values = buildRowValues(table, draft, changedColumns, isWritable, row)
      if (row && Object.keys(values).length === 0) {
        close()
        return
      }
      const target = { schema: table.schema, table: table.name }
      const savedRow = await onSave(
        row
          ? {
              kind: 'update',
              ...target,
              key: rowKey(table, row),
              values,
              previous: Object.fromEntries(Object.keys(values).map((key) => [key, row[key]])),
            }
          : { kind: 'insert', ...target, values }
      )
      saved(savedRow)
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      lock.current = false
      setIsBusy(false)
    }
  }

  const requestClose = () => (isDirty ? setIsConfirmingDiscard(true) : close())

  const form = (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        {table.columns.map((column) => (
          <RowField
            key={column.name}
            id={`${id}-${column.name}`}
            column={column}
            field={draft[column.name]}
            isPrimaryKey={table.primary_keys.includes(column.name)}
            isEditable={canEditColumn(table, column, isWritable, row)}
            isBusy={isBusy}
            isInsert={!row}
            onChange={(value) => handleFieldChange(column.name, value)}
          />
        ))}
      </div>
      {error && (
        <div className="px-5 pb-3">
          <Admonition
            type="destructive"
            title={row ? 'Failed to save row' : 'Failed to insert row'}
            description={error}
          />
        </div>
      )}
      <RowEditorFooter
        isWritable={isWritable}
        isConfirmingDiscard={isConfirmingDiscard}
        isBusy={isBusy}
        isInsert={!row}
        changedCount={changedColumns.length}
        cancelLabel={cancelLabel}
        onKeepEditing={() => setIsConfirmingDiscard(false)}
        onDiscard={close}
        onCancel={requestClose}
      />
    </form>
  )
  return container ? container(form, { requestClose, busy: isBusy }) : form
}

function RowEditorFooter({
  isWritable,
  isConfirmingDiscard,
  isBusy,
  isInsert,
  changedCount,
  cancelLabel,
  onKeepEditing,
  onDiscard,
  onCancel,
}: {
  isWritable: boolean
  isConfirmingDiscard: boolean
  isBusy: boolean
  isInsert: boolean
  changedCount: number
  cancelLabel: string
  onKeepEditing: () => void
  onDiscard: () => void
  onCancel: () => void
}) {
  const footerClassName = 'flex shrink-0 items-center gap-2 border-t px-5 py-3'

  if (!isWritable) {
    return (
      <p className={`${footerClassName} text-sm text-foreground-lighter`}>This row is read-only.</p>
    )
  }

  if (isConfirmingDiscard) {
    return (
      <div role="alert" className={footerClassName}>
        <p className="flex-1 text-sm text-foreground">Discard your unsaved changes?</p>
        <Button variant="default" size="tiny" onClick={onKeepEditing}>
          Keep editing
        </Button>
        <Button variant="danger" size="tiny" onClick={onDiscard}>
          Discard changes
        </Button>
      </div>
    )
  }

  const summary = isInsert
    ? 'Omitted fields use database defaults'
    : `${changedCount} ${changedCount === 1 ? 'field' : 'fields'} changed`
  const submitLabel = isInsert ? 'Insert row' : 'Save changes'
  return (
    <div className={footerClassName}>
      <span className="flex-1 text-xs text-foreground-lighter">{summary}</span>
      <Button variant="default" size="tiny" disabled={isBusy} onClick={onCancel}>
        {cancelLabel}
      </Button>
      <Button
        variant="primary"
        size="tiny"
        type="submit"
        loading={isBusy}
        disabled={!isInsert && changedCount === 0}
      >
        {isBusy ? 'Saving…' : submitLabel}
      </Button>
    </div>
  )
}
