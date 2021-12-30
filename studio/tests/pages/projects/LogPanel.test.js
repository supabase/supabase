import LogPanel from 'components/interfaces/Settings/Logs/LogPanel'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('templates', async () => {
  const mockFn = jest.fn()
  render(<LogPanel templates={[{ label: 'Some option', onClick: mockFn }]} />)
  const search = screen.getByPlaceholderText(/Search/)
  userEvent.type(search, '12345')

  // TODO templates dropdown interaction currently cannot be tested
  // https://github.com/supabase/ui/issues/299
  // userEvent.click(screen.getByText("Templates"))
  // screen.debug()

  // await waitFor(() => screen.getByText("Some option"))
  // userEvent.click(screen.getByText("Some option"))
  // expect(mockFn).toBeCalled()
})

test('filter input change and submit', async () => {
  const mockFn = jest.fn()
  render(<LogPanel onSearch={mockFn} />)
  const search = screen.getByPlaceholderText(/Search/)
  userEvent.type(search, '12345')
  expect(mockFn).not.toBeCalled()
  userEvent.click(screen.getByText('Go'))
  expect(mockFn).toBeCalled()
})

test('filter input value', async () => {
  render(<LogPanel defaultSearchValue={'1234'} />)
  screen.getByDisplayValue('1234')
})

test('Manual refresh', async () => {
  const mockFn = jest.fn()
  render(<LogPanel onRefresh={mockFn} />)
  let btn
  await waitFor(() => {
    btn = screen.getByText(/Refresh/)
  })
  userEvent.click(btn)
  expect(mockFn).toBeCalled()
})

test('reset search filter', async () => {
  const { rerender } = render(<LogPanel />)
  expect(() => screen.getByTitle(/Clear search/)).toThrow()

  rerender(<LogPanel defaultSearchValue="something123" />)
  await waitFor(() => screen.getByDisplayValue(/something123/))
  userEvent.click(screen.getByTitle(/Clear search/))
  expect(() => screen.getByTitle(/Clear search/)).toThrow()
  expect(() => screen.getByDisplayValue(/something123/)).toThrow()
})
