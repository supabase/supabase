import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { renderWithTooltip, testTable } from '../test-utils'
import { RowEditorForm, type SaveRow } from './row-editor'

// Globals are off in this package, so Testing Library cannot clean up on its own.
afterEach(cleanup)

const table = testTable()
const row = { id: '9007199254740993', label: 'Old label' }

function renderForm(
  props: Partial<Parameters<typeof RowEditorForm>[0]> = {},
  onSave = vi.fn<SaveRow>(() => Promise.reject(new Error('Unexpected save in this test')))
) {
  const close = vi.fn()
  const saved = vi.fn()
  renderWithTooltip(
    <RowEditorForm table={table} row={row} close={close} saved={saved} onSave={onSave} {...props} />
  )
  return { close, saved, onSave }
}

describe('RowEditorForm', () => {
  it('saves only the changed field with its previous value so concurrent edits are detected', async () => {
    const savedRow = { ...row, label: 'New label' }
    const { saved, onSave } = renderForm({}, vi.fn<SaveRow>().mockResolvedValue(savedRow))

    fireEvent.change(screen.getByLabelText('label'), { target: { value: 'New label' } })
    expect(screen.getByText('1 field changed')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(saved).toHaveBeenCalledWith(savedRow))
    expect(onSave).toHaveBeenCalledWith({
      kind: 'update',
      schema: 'public',
      table: 'items',
      key: { id: '9007199254740993' },
      values: { label: 'New label' },
      previous: { label: 'Old label' },
    })
  })

  it('shows a conflict from the host and keeps the edit so the user can retry', async () => {
    const onSave = vi
      .fn<SaveRow>()
      .mockRejectedValue(new Error('The row changed since it was read.'))
    const { saved } = renderForm({}, onSave)

    fireEvent.change(screen.getByLabelText('label'), { target: { value: 'New label' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))

    expect((await screen.findByRole('alert')).textContent).toContain('The row changed')
    expect(saved).not.toHaveBeenCalled()
    expect(screen.getByLabelText<HTMLInputElement>('label').value).toBe('New label')
  })

  it('asks before discarding unsaved edits', () => {
    const { close } = renderForm()

    fireEvent.change(screen.getByLabelText('label'), { target: { value: 'New label' } })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    expect(close).not.toHaveBeenCalled()
    expect(screen.getByText('Discard your unsaved changes?')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Discard changes' }))
    expect(close).toHaveBeenCalled()
  })

  it('closes without asking when nothing changed', () => {
    const { close } = renderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(close).toHaveBeenCalled()
  })

  it('locks the primary key of an existing row', () => {
    renderForm()
    expect(screen.getByLabelText<HTMLInputElement>('id').disabled).toBe(true)
    expect(screen.getByLabelText<HTMLInputElement>('label').disabled).toBe(false)
  })

  it('offers no save on a read-only connection', () => {
    renderForm({ readOnly: true })
    expect(screen.getByText('This row is read-only.')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Save changes' })).toBeNull()
  })

  it('leaves Default fields out of an insert so the database fills them', async () => {
    const withDefault = testTable({
      columns: [
        ...table.columns,
        {
          ...table.columns[1],
          name: 'created_at',
          default_value: 'now()',
        },
      ],
    })
    const onSave = vi.fn<SaveRow>().mockResolvedValue({ id: '1', label: 'Hi', created_at: 'x' })
    const { saved } = renderForm({ table: withDefault, row: undefined }, onSave)

    fireEvent.change(screen.getByLabelText('id'), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText('label'), { target: { value: 'Hi' } })
    fireEvent.click(screen.getByRole('button', { name: 'Insert row' }))

    await waitFor(() => expect(saved).toHaveBeenCalled())
    expect(onSave).toHaveBeenCalledWith({
      kind: 'insert',
      schema: 'public',
      table: 'items',
      values: { id: '1', label: 'Hi' },
    })
  })
})
