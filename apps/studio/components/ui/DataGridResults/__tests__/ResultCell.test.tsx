import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { ResultCell } from '../ResultCell'
import { customRender as render } from '@/tests/lib/custom-render'

const noop = () => {}

test('renders a short value without the expand button', () => {
  render(<ResultCell column="name" value="alice" onContextMenu={noop} onExpand={noop} />)
  expect(screen.getByText('alice')).toBeInTheDocument()
  expect(screen.queryByRole('button', { name: 'View full cell content' })).not.toBeInTheDocument()
})

test('renders NULL for null values', () => {
  render(<ResultCell column="name" value={null} onContextMenu={noop} onExpand={noop} />)
  expect(screen.getByText('NULL')).toBeInTheDocument()
})

test('shows the expand button for large values and calls onExpand with column and value', async () => {
  const onExpand = vi.fn()
  const value = { nested: true }
  render(<ResultCell column="data" value={value} onContextMenu={noop} onExpand={onExpand} />)

  await userEvent.click(screen.getByRole('button', { name: 'View full cell content' }))

  expect(onExpand).toHaveBeenCalledTimes(1)
  expect(onExpand).toHaveBeenCalledWith('data', value)
})

test('right-clicking the cell calls onContextMenu with column and value', () => {
  const onContextMenu = vi.fn()
  render(<ResultCell column="name" value="alice" onContextMenu={onContextMenu} onExpand={noop} />)

  fireEvent.contextMenu(screen.getByText('alice'))

  expect(onContextMenu).toHaveBeenCalledTimes(1)
  const [, column, value] = onContextMenu.mock.calls[0]
  expect(column).toBe('name')
  expect(value).toBe('alice')
})
