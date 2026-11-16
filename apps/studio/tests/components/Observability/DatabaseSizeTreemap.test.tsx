import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DatabaseSizeTreemap } from '@/components/interfaces/Observability/DatabaseSize/DatabaseSizeTreemap'
import type { DatabaseSizeRelation } from '@/data/database/database-size-breakdown-query'

const mb = 1024 ** 2
const relations: DatabaseSizeRelation[] = [
  {
    id: '1',
    name: 'orders',
    schema: 'public',
    table_bytes: 60 * mb,
    index_bytes: 20 * mb,
    toast_bytes: 10 * mb,
    indexes: [],
  },
  {
    id: '2',
    name: 'small_events',
    schema: 'public',
    table_bytes: mb,
    index_bytes: 0,
    toast_bytes: 0,
    indexes: [],
  },
  {
    id: '3',
    name: 'small_logs',
    schema: 'public',
    table_bytes: mb,
    index_bytes: 0,
    toast_bytes: 0,
    indexes: [],
  },
  {
    id: '4',
    name: 'jobs',
    schema: 'cron',
    table_bytes: 20 * mb,
    index_bytes: 0,
    toast_bytes: 0,
    indexes: [],
  },
  {
    id: '5',
    name: 'users',
    schema: 'auth',
    table_bytes: mb,
    index_bytes: 0,
    toast_bytes: 0,
    indexes: [],
  },
  {
    id: '6',
    name: 'objects',
    schema: 'storage',
    table_bytes: mb,
    index_bytes: 0,
    toast_bytes: 0,
    indexes: [],
  },
]

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue(
    new DOMRect(0, 0, 900, 320)
  )
})

afterEach(() => vi.restoreAllMocks())

describe('database size treemap details', () => {
  it('shows schema, selected metric, percentage and underlying sizes on native Recharts hover', async () => {
    const user = userEvent.setup()
    render(<DatabaseSizeTreemap relations={relations} metric="total" />)
    const object = await screen.findByRole('button', { name: /^public.orders:/ })
    await user.hover(object)
    const tooltip = await screen.findByRole('tooltip')
    expect(within(tooltip).getByText('public.orders')).toBeInTheDocument()
    expect(
      within(tooltip).getByText('Total size: 90 MB (78.9% of selected metric)')
    ).toBeInTheDocument()
    expect(within(tooltip).getByText('60 MB')).toBeInTheDocument()
    expect(within(tooltip).getByText('20 MB')).toBeInTheDocument()
    expect(within(tooltip).getByText('10 MB')).toBeInTheDocument()
    await user.unhover(object)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('explains grouped objects on hover and keeps grouped schema details available on tap or focus', async () => {
    const user = userEvent.setup()
    const { rerender } = render(<DatabaseSizeTreemap relations={relations} metric="table" />)
    await user.hover(await screen.findByRole('button', { name: /^public.Other objects:/ }))
    const tooltip = await screen.findByRole('tooltip')
    expect(within(tooltip).getByText('2 objects in public')).toBeInTheDocument()
    expect(within(tooltip).getByText('public.small_events')).toBeInTheDocument()
    expect(within(tooltip).getByText('public.small_logs')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Other schemas (2 schemas)' }))
    expect(screen.getByText('2 objects across 2 schemas')).toBeInTheDocument()
    expect(screen.getByText('auth.users')).toBeInTheDocument()
    expect(screen.getByText('storage.objects')).toBeInTheDocument()
    fireEvent.focus(screen.getByRole('button', { name: /^public.orders:/ }))
    expect(screen.getByText('Table size: 60 MB (71.4% of selected metric)')).toBeInTheDocument()
    rerender(<DatabaseSizeTreemap relations={relations} metric="index" />)
    expect(screen.getByText('Index size: 20 MB (100.0% of selected metric)')).toBeInTheDocument()
  })
})
