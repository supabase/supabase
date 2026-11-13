import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Bootstrap, RowPanel as RowLaunch } from '../contract'
import { renderWithTooltip, testCapabilities, testProject, testTable } from '../test-utils'
import type { SaveRow } from './row-editor'
import { RowPanel, type ReloadRow, type RowPanelHandle, type RowPanelSnapshot } from './row-panel'

afterEach(cleanup)

const table = testTable()
const launch: RowLaunch = {
  id: 'row-launch',
  project_id: testProject.id,
  view: 'row',
  table,
  row: { id: '9007199254740993', label: 'Secret label' },
}
const initial: Bootstrap = {
  projects: [testProject],
  organizations: [],
  regions: [],
  capabilities: { ...testCapabilities, readOnly: false },
}

function renderPanel({
  onReload = vi.fn<ReloadRow>(() => Promise.reject(new Error('Unexpected reload'))),
  onSave = vi.fn<SaveRow>(() => Promise.reject(new Error('Unexpected save'))),
  onSnapshotChange,
}: {
  onReload?: ReloadRow
  onSave?: SaveRow
  onSnapshotChange?: (snapshot: RowPanelSnapshot) => void
} = {}) {
  const ref = createRef<RowPanelHandle>()
  renderWithTooltip(
    <RowPanel
      ref={ref}
      initial={initial}
      launch={launch}
      onReload={onReload}
      onSave={onSave}
      onSnapshotChange={onSnapshotChange}
    />
  )
  return { ref }
}

describe('RowPanel', () => {
  it('shares panel state with the host without row contents', () => {
    const onSnapshotChange = vi.fn()
    renderPanel({ onSnapshotChange })

    expect(onSnapshotChange).toHaveBeenCalledWith(
      expect.objectContaining({ view: 'row', schema: 'public', table: 'items', dirty: false })
    )
    expect(JSON.stringify(onSnapshotChange.mock.calls)).not.toContain('Secret label')
  })

  it('refuses to refresh over unsaved edits', () => {
    const onReload = vi.fn<ReloadRow>()
    const { ref } = renderPanel({ onReload })

    fireEvent.change(screen.getByLabelText('label'), { target: { value: 'Edited' } })

    expect(() => ref.current?.refresh()).toThrow('Save or discard row edits')
    expect(onReload).not.toHaveBeenCalled()
    expect(ref.current?.read().dirty).toBe(true)
  })

  it('reloads the row by its complete primary key', async () => {
    const onReload = vi.fn<ReloadRow>().mockResolvedValue({
      table,
      row: { id: '9007199254740993', label: 'Fresh label' },
    })
    renderPanel({ onReload })

    fireEvent.click(screen.getByRole('button', { name: 'Refresh row' }))

    await waitFor(() =>
      expect(screen.getByLabelText<HTMLInputElement>('label').value).toBe('Fresh label')
    )
    expect(onReload).toHaveBeenCalledWith({
      schema: 'public',
      table: 'items',
      key: { id: '9007199254740993' },
    })
    expect(screen.getByText('Row refreshed')).toBeTruthy()
  })

  it('starts a fresh baseline after a save so later edits compare against the saved row', async () => {
    const onSave = vi.fn<SaveRow>().mockResolvedValue({ id: '9007199254740993', label: 'Saved' })
    renderPanel({ onSave })

    fireEvent.change(screen.getByLabelText('label'), { target: { value: 'Saved' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save changes' }))
    })

    expect(await screen.findByText('Row saved')).toBeTruthy()
    expect(screen.getByText('0 fields changed')).toBeTruthy()
  })
})
