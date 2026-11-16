import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { DatabaseSizeTable } from '@/components/interfaces/Observability/DatabaseSize/DatabaseSizeTable'
import type { DatabaseSizeRelation } from '@/data/database/database-size-breakdown-query'

const relations: DatabaseSizeRelation[] = [
  {
    id: '1',
    name: 'orders',
    schema: 'public',
    table_bytes: 400,
    index_bytes: 200,
    toast_bytes: 100,
    indexes: [{ id: '11', name: 'orders_pkey', bytes: 200 }],
  },
  {
    id: '2',
    name: 'users',
    schema: 'auth',
    table_bytes: 200,
    index_bytes: 100,
    toast_bytes: 0,
    indexes: [{ id: '21', name: 'users_pkey', bytes: 100 }],
  },
]

const bodyRows = () => within(screen.getByRole('table')).getAllByRole('row').slice(1)

describe('database size objects', () => {
  it('switches accounting views and filters by schema, with staged Escape', async () => {
    const user = userEvent.setup()
    render(<DatabaseSizeTable relations={relations} />)
    expect(bodyRows()).toHaveLength(5)
    await user.click(screen.getByRole('tab', { name: 'Tables' }))
    expect(bodyRows()).toHaveLength(2)
    expect(screen.getByRole('tabpanel', { name: 'Tables' })).toBeInTheDocument()
    expect(within(bodyRows()[0]).getByText('70.0%')).toBeInTheDocument()
    const search = screen.getByRole('textbox', { name: 'Search objects' })
    await user.type(search, 'auth')
    expect(bodyRows()).toHaveLength(1)
    expect(within(bodyRows()[0]).getByText('users')).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(search).toHaveValue('')
    expect(search).toHaveFocus()
    expect(bodyRows()).toHaveLength(2)
    await user.keyboard('{Escape}')
    expect(search).not.toHaveFocus()
    await user.click(screen.getByRole('tab', { name: 'TOAST' }))
    expect(bodyRows()).toHaveLength(1)
    expect(within(bodyRows()[0]).getByText('orders (TOAST)')).toBeInTheDocument()
  })

  it('sorts object names and shows search empty state', async () => {
    const user = userEvent.setup()
    render(<DatabaseSizeTable relations={relations} />)
    await user.click(screen.getByRole('button', { name: 'Object' }))
    expect(within(bodyRows()[0]).getByText('orders')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Object' })).toHaveAttribute(
      'aria-sort',
      'ascending'
    )
    await user.click(screen.getByRole('button', { name: 'Object' }))
    expect(within(bodyRows()[0]).getByText('users_pkey')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: 'Search objects' }), 'missing')
    expect(screen.getByText('No matching objects found')).toBeInTheDocument()
  })

  it('paginates and resets to the first page when searching', async () => {
    const user = userEvent.setup()
    render(
      <DatabaseSizeTable
        relations={Array.from({ length: 12 }, (_, index) => ({
          ...relations[0],
          id: `${index}`,
          name: `table_${index}`,
          indexes: [],
          index_bytes: 0,
          toast_bytes: 0,
        }))}
      />
    )
    expect(bodyRows()).toHaveLength(10)
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(bodyRows()).toHaveLength(2)
    await user.type(screen.getByRole('textbox', { name: 'Search objects' }), 'table_0')
    expect(bodyRows()).toHaveLength(1)
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument()
  })
})
