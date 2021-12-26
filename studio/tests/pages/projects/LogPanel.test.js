import LogPanel from 'components/interfaces/Settings/Logs/LogPanel'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

test('templates', async () => {
  const mockFn = jest.fn()
  render(<LogPanel templates={[
    { label: 'Some option', onClick: mockFn }
  ]} />)
  const search = screen.getByPlaceholderText(/Search/)
  userEvent.type(search, "12345")


  // TODO templates dropdown interaction currently cannot be tested
  // https://github.com/supabase/ui/issues/299
  // userEvent.click(screen.getByText("Templates"))
  // screen.debug()

  // await waitFor(() => screen.getByText("Some option"))
  // userEvent.click(screen.getByText("Some option"))
  // expect(mockFn).toBeCalled()
})

test("filter input change", async () => {
  const mockFn = jest.fn()
  render(<LogPanel onSearch={mockFn} />)
  const search = screen.getByPlaceholderText(/Search/)
  userEvent.type(search, "12345")
  expect(mockFn).toBeCalled()
})

test("filter input value", async () => {
  render(<LogPanel searchValue={"1234"} />)
  screen.getByDisplayValue("1234")
})


test("Manual refresh", async () => {
  const mockFn = jest.fn()
  render(<LogPanel onRefresh={mockFn} />)
  let btn
  await waitFor(() => {
    btn = screen.getByText(/Refresh/)
  })
  userEvent.click(btn)
  expect(mockFn).toBeCalled()
})

test("reset filters", () => {
  const mockFn = jest.fn()
  const { rerender } = render(<LogPanel showReset={false} />)
  expect(() => screen.getByText(/Clear search/)).toThrow()

  rerender(<LogPanel showReset={true} onReset={mockFn} />)
  userEvent.click(screen.getByTitle(/Clear search/))
  expect(mockFn).toBeCalled()
})