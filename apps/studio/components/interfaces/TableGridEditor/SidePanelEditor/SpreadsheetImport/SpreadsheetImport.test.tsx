import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { describe, expect, test, vi } from 'vitest'

import { SpreadsheetImport } from './SpreadsheetImport'
import { identityColumn, importTable } from './SpreadsheetImport.fixtures'
import { customRender } from '@/tests/lib/custom-render'

const table = { ...importTable, columns: [identityColumn] }

mockAnimationsApi()
vi.mock('./SpreadsheetPreviewGrid', () => ({ default: () => null }))
vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => vi.fn() }))

async function pasteCSV() {
  await userEvent.click(screen.getByRole('tab', { name: 'Paste text' }))
  fireEvent.change(screen.getByRole('textbox', { name: 'CSV text' }), {
    target: { value: 'id\n1\n1' },
  })
  await screen.findByText('A total of 2 rows will be processed', { exact: false })
  await userEvent.click(screen.getByRole('button', { name: 'Toggle import configuration' }))
}

describe('spreadsheet conflict configuration', () => {
  test('defaults off and submits the selected setting', async () => {
    const saveContent = vi.fn()
    const updateEditorDirty = vi.fn()
    customRender(
      <SpreadsheetImport
        visible
        selectedTable={table}
        saveContent={saveContent}
        closePanel={vi.fn()}
        updateEditorDirty={updateEditorDirty}
      />
    )
    await pasteCSV()
    const toggle = screen.getByRole('switch', { name: 'Skip conflicting rows' })
    expect(toggle).not.toBeChecked()
    await userEvent.click(toggle)
    expect(toggle).toBeChecked()
    expect(updateEditorDirty).toHaveBeenCalledWith(true)
    fireEvent.click(screen.getByRole('button', { name: 'Import data' }))
    await waitFor(() =>
      expect(saveContent).toHaveBeenCalledWith(
        expect.objectContaining({
          skipConflictingRows: true,
          rows: [{ id: '1' }, { id: '1' }],
        })
      )
    )
  })

  test('preserves the setting across tabs and reparsing', async () => {
    const props = { visible: true, selectedTable: table, saveContent: vi.fn(), closePanel: vi.fn() }
    customRender(<SpreadsheetImport {...props} />)
    await pasteCSV()
    await userEvent.click(screen.getByRole('switch', { name: 'Skip conflicting rows' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Upload CSV' }))
    await userEvent.click(screen.getByRole('tab', { name: 'Paste text' }))
    await userEvent.click(screen.getByRole('button', { name: 'Toggle import configuration' }))
    expect(screen.getByRole('switch', { name: 'Skip conflicting rows' })).toBeChecked()
    fireEvent.change(screen.getByRole('textbox', { name: 'CSV text' }), {
      target: { value: 'id\n1\n2\n3' },
    })
    await screen.findByText('A total of 3 rows will be processed', { exact: false })
    await userEvent.click(screen.getByRole('button', { name: 'Toggle import configuration' }))
    expect(screen.getByRole('switch', { name: 'Skip conflicting rows' })).toBeChecked()
  })

  test('does not offer conflict skipping for new tables', async () => {
    customRender(<SpreadsheetImport visible saveContent={vi.fn()} closePanel={vi.fn()} />)
    await userEvent.click(screen.getByRole('tab', { name: 'Paste text' }))
    fireEvent.change(screen.getByRole('textbox', { name: 'CSV text' }), {
      target: { value: 'id\n1' },
    })
    await screen.findByText('Your table will have 1 row and the following 1 column.', {
      exact: true,
    })
    await userEvent.click(screen.getByRole('button', { name: 'Toggle import configuration' }))
    expect(screen.queryByRole('switch', { name: 'Skip conflicting rows' })).not.toBeInTheDocument()
  })

  test('prevents further edits and closing until import completion', async () => {
    const completion = Promise.withResolvers<void>()
    const closePanel = vi.fn()
    customRender(
      <SpreadsheetImport
        visible
        selectedTable={table}
        saveContent={() => completion.promise}
        closePanel={closePanel}
      />
    )
    await pasteCSV()
    fireEvent.click(screen.getByRole('button', { name: 'Import data' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled())
    expect(screen.getByRole('switch', { name: 'Skip conflicting rows' })).toBeDisabled()
    await userEvent.keyboard('{Escape}')
    expect(closePanel).not.toHaveBeenCalled()
    completion.resolve()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Import data' })).toBeEnabled())
  })
})
