import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { logAttributeFilterId } from '../UnifiedLogs.filters'
import { columnSchema } from '../UnifiedLogs.schema'
import { LogOverview } from './LogOverview'

const row = columnSchema.parse({
  id: 'postgres-log',
  log_type: 'postgres',
  timestamp: '2026-01-01T10:00:00Z',
  date: new Date('2026-01-01T10:00:00Z'),
  event_message: 'Statement finished',
  method: null,
  pathname: null,
  status: null,
  level: 'success',
})

function Overview({ attribute, value }: { attribute: string; value: string | number | boolean }) {
  const table = useReactTable({ data: [row], columns: [], getCoreRowModel: getCoreRowModel() })
  return (
    <>
      <LogOverview
        data={row}
        table={table}
        filterFields={[]}
        attributes={{ [attribute]: value }}
        onAddAttributeFilter={(key, filterValue) =>
          table.setColumnFilters([
            { id: logAttributeFilterId(key), value: { operator: '=', values: [filterValue] } },
          ])
        }
      />
      <output aria-label="Selected filters">
        {JSON.stringify(table.getState().columnFilters)}
      </output>
    </>
  )
}

describe('specialized log attribute actions', () => {
  it.each([
    ['request_id', 'req-1'],
    ['trace_id', 'trace-1'],
    ['span_id', 'span-1'],
    ['execution_id', 'exec-1'],
    ['request.count', 0],
    ['request.enabled', false],
  ] as const)('filters by the stored %s key and scalar value', async (attribute, value) => {
    const user = userEvent.setup()
    render(<Overview attribute={attribute} value={value} />)
    await user.click(screen.getByRole('button', { name: 'Attributes' }))
    const section = attribute.startsWith('request.') ? 'Request' : 'Details'
    await user.click(screen.getByRole('button', { name: section }))
    const label = attribute.replace(/^request\./, '')
    await user.click(screen.getByRole('button', { name: `${label} ${value}` }))
    await user.click(screen.getByRole('menuitem', { name: 'Add filter' }))
    expect(screen.getByRole('status', { name: 'Selected filters' })).toHaveTextContent(
      JSON.stringify([
        { id: `attribute.${attribute}`, value: { operator: '=', values: [String(value)] } },
      ])
    )
  })
})
