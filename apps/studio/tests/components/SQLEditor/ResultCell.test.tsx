import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

import { ResultCell } from '@/components/interfaces/SQLEditor/UtilityPanel/ResultCell'
import { customRender as render } from '@/tests/lib/custom-render'

const noop = () => {}

test('renders the formatted cell value', () => {
  render(<ResultCell column="name" value="alice" onContextMenu={noop} onExpand={noop} />)
  expect(screen.getByText('alice')).toBeTruthy()
})

test('renders NULL for null values', () => {
  render(<ResultCell column="name" value={null} onContextMenu={noop} onExpand={noop} />)
  expect(screen.getByText('NULL')).toBeTruthy()
})

test('does not render the expand button for short string values', () => {
  render(<ResultCell column="name" value="alice" onContextMenu={noop} onExpand={noop} />)
  expect(screen.queryByRole('button', { name: 'View full cell content' })).toBeNull()
})

test('renders the expand button for object values', () => {
  render(<ResultCell column="data" value={{ nested: true }} onContextMenu={noop} onExpand={noop} />)
  expect(screen.getByRole('button', { name: 'View full cell content' })).toBeTruthy()
})

test('renders the expand button for long string values', () => {
  render(<ResultCell column="bio" value={'a'.repeat(120)} onContextMenu={noop} onExpand={noop} />)
  expect(screen.getByRole('button', { name: 'View full cell content' })).toBeTruthy()
})

test('clicking the expand button calls onExpand with column and value', async () => {
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
