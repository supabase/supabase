import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DetailRow } from './DetailRow'

function FilterableDetailRow() {
  const table = useReactTable({
    data: [{ method: 'GET' }],
    columns: [{ accessorKey: 'method' }],
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <>
      <DetailRow
        config={{ id: 'method', label: 'Method', getValue: () => 'GET' }}
        value="GET"
        level="success"
        table={table}
        filterFields={[{ value: 'method', label: 'Method', type: 'checkbox' }]}
      />
      <output aria-label="Selected filters">
        {JSON.stringify(table.getState().columnFilters)}
      </output>
    </>
  )
}

describe('overview detail row actions', () => {
  it('opens copy-only actions from the entire row with the keyboard', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    render(
      <DetailRow
        config={{ id: 'count', label: 'Count', getValue: () => 0 }}
        value={0}
        level={null}
        filterFields={[]}
      />
    )
    expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument()
    const row = screen.getByRole('button')
    row.focus()
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('menuitem', { name: /filter/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Copy Count' }))
    expect(copy).toHaveBeenCalledWith('0')
  })

  it('offers filter and copy actions in the same menu for filterable rows', async () => {
    const user = userEvent.setup()
    render(<FilterableDetailRow />)
    await user.click(screen.getByText('GET'))
    expect(screen.getByRole('menuitem', { name: 'Copy Method' })).toBeVisible()
    await user.click(screen.getByRole('menuitem', { name: 'Add filter' }))
    expect(screen.getByRole('status', { name: 'Selected filters' })).toHaveTextContent(
      '"values":["GET"]'
    )
  })
})
