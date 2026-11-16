import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DetailRow } from './DetailRow'
import { customRender as render } from '@/tests/lib/custom-render'

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

function CopyOnlyDetailRow() {
  return (
    <DetailRow
      config={{ id: 'count', label: 'Count', getValue: () => 0 }}
      value={0}
      level={null}
      filterFields={[]}
    />
  )
}

function setIsHoverDevice(isHoverDevice: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: isHoverDevice && query.includes('hover: hover'),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

describe('overview detail row actions on touch devices', () => {
  it('opens copy-only actions from the entire row with the keyboard', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    render(<CopyOnlyDetailRow />)
    expect(screen.queryByRole('button', { name: 'More options' })).not.toBeInTheDocument()
    const row = screen.getByRole('button')
    row.focus()
    await user.keyboard('{Enter}')
    expect(screen.queryByRole('menuitem', { name: /filter/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Copy Count' }))
    expect(copy).toHaveBeenCalledWith('0')
  })

  it('applies equals and not equals from the same menu for filterable rows', async () => {
    const user = userEvent.setup()
    render(<FilterableDetailRow />)
    await user.click(screen.getByText('GET'))
    expect(screen.getByRole('menuitem', { name: 'Copy Method' })).toBeVisible()
    await user.click(screen.getByRole('menuitem', { name: 'Filter: equals' }))
    expect(screen.getByRole('status', { name: 'Selected filters' })).toHaveTextContent(
      '"operator":"=","values":["GET"]'
    )

    await user.click(screen.getByText('GET'))
    await user.click(screen.getByRole('menuitem', { name: 'Filter: not equals' }))
    expect(screen.getByRole('status', { name: 'Selected filters' })).toHaveTextContent(
      '"operator":"<>","values":["GET"]'
    )
  })
})

describe('overview detail row actions on hover devices', () => {
  beforeEach(() => setIsHoverDevice(true))
  afterEach(() => setIsHoverDevice(false))

  it('applies equals and not equals from the same menu as touch devices', async () => {
    const user = userEvent.setup()
    render(<FilterableDetailRow />)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(screen.getByText('GET'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Actions for Method' }))
    expect(screen.getByRole('menuitem', { name: 'Copy Method' })).toBeVisible()
    await user.click(screen.getByRole('menuitem', { name: 'Filter: equals' }))
    expect(screen.getByRole('status', { name: 'Selected filters' })).toHaveTextContent(
      '"operator":"=","values":["GET"]'
    )

    await user.click(screen.getByRole('button', { name: 'Actions for Method' }))
    await user.click(screen.getByRole('menuitem', { name: 'Filter: not equals' }))
    expect(screen.getByRole('status', { name: 'Selected filters' })).toHaveTextContent(
      '"operator":"<>","values":["GET"]'
    )
  })

  it('offers copy but no filter on a row that cannot be filtered', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    render(<CopyOnlyDetailRow />)
    await user.click(screen.getByRole('button', { name: 'Actions for Count' }))
    expect(screen.queryByRole('menuitem', { name: /filter/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('menuitem', { name: 'Copy Count' }))
    expect(copy).toHaveBeenCalledWith('0')
  })
})
