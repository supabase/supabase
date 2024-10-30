import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'

test.skip('filter input change and submit', async () => {
  const mockFn = vi.fn()
  // render(<PreviewFilterPanel  onSearch={mockFn} queryUrl={'/'} />)
  expect(mockFn).not.toBeCalled()
  const search = screen.getByPlaceholderText(/Search/)
  userEvent.type(search, '12345{enter}')
  expect(mockFn).toBeCalled()
})

// test('filter input value', async () => {
//   render(<PreviewFilterPanel defaultSearchValue={'1234'} queryUrl={'/'} />)
//   await screen.findByDisplayValue('1234')
// })

// test('Manual refresh', async () => {
//   const mockFn = vi.fn()
//   render(<PreviewFilterPanel onRefresh={mockFn} queryUrl={'/'} />)
//   const btn = await screen.findByTitle('refresh')
//   userEvent.click(btn)
//   expect(mockFn).toBeCalled()
// })
// test('Datepicker dropdown', async () => {
//   const fn = vi.fn()
//   render(<PreviewFilterPanel onSearch={fn} queryUrl={'/'} />)
//   clickDropdown(await screen.findByText(/Last hour/))
//   userEvent.click(await screen.findByText(/Last 3 hours/))
//   expect(fn).toBeCalled()
// })

// test('shortened count to K', async () => {
//   render(<PreviewFilterPanel newCount={1234} queryUrl={'/'} />)
//   await screen.findByText(/1\.2K/)
// })
