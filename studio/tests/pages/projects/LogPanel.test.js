import LogPanel from 'components/interfaces/Settings/Logs/LogPanel'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getToggleByText } from 'tests/helpers'

jest.mock('components/ui/Flag/Flag')
import Flag from 'components/ui/Flag/Flag'
Flag.mockImplementation(({ children }) => <>{children}</>)
jest.mock('hooks')
import { useFlag } from 'hooks'
useFlag.mockReturnValue(true)

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
test('custom mode', async () => {
  render(<LogPanel isCustomQuery />)
  await waitFor(() => {
    expect(() => screen.getByPlaceholderText(/Search/)).toThrow()
  })
})

test('toggle event chart', async () => {
  const mockFn = jest.fn()
  const { rerender } = render(<LogPanel onToggleEventChart={mockFn} isShowingEventChart={true} />)
  const toggle = getToggleByText(/Show event chart/)
  userEvent.click(toggle)
  expect(mockFn).toBeCalled()
  rerender(<LogPanel isShowingEventChart={false} />)
})

test('filter input change and submit', async () => {
  const mockFn = jest.fn()
  render(<LogPanel onSearch={mockFn} />)
  const search = screen.getByPlaceholderText(/Search/)
  userEvent.type(search, '12345')
  expect(mockFn).not.toBeCalled()
  userEvent.click(screen.getByTitle('Go'))
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

test('timestamp to/from filter default value', async () => {
  render(<LogPanel defaultToValue="2022-01-18T10:43:39+0000" />)
  userEvent.click(await screen.findByText('Custom'))
  await screen.findByDisplayValue('2022-01-18T10:43:39+0000')
  // TODO: use screen.findByLabelText when https://github.com/supabase/ui/issues/310 is resolved
  await screen.findByText('To')
  await screen.findByText('From')
})

test('timestamp to/from filter error handling', async () => {
  const mockFn = jest.fn()
  render(<LogPanel onSearch={mockFn} />)
  userEvent.click(await screen.findByText(/Now/))

  // display iso timestamp
  const year = new Date().getFullYear()
  const inputs = await screen.findAllByDisplayValue(RegExp(year))
  expect(inputs.length).toBe(2)
  const input = inputs[0]
  userEvent.clear(input)
  userEvent.type(input, '123456')
  await screen.findByText(/[iI]nvalid ISO 8601 timestamp/)
})

test('timestamp to/from filter value change', async () => {
  const mockFn = jest.fn()
  render(<LogPanel onSearch={mockFn} />)
  userEvent.click(await screen.findByText(/Now/))
  // display iso timestamp
  const year = new Date().getFullYear()
  const inputs = await screen.findAllByDisplayValue(RegExp(year))

  for (const input of inputs) {
    // replace the input's value
    userEvent.clear(input)

    // get time 20 mins before
    const newDate = new Date()
    newDate.setMinutes(new Date().getMinutes() - 20)
    userEvent.type(input, newDate.toISOString())
  }

  // input actions
  const set = await screen.findByRole('button', { name: 'Set' })

  userEvent.click(set)
  expect(mockFn).toBeCalled()
  await screen.findByText('Custom')
  await screen.findByTitle(/Clear timestamp filter/)
})

test('custom query mode hides elements', async () => {
  const { rerender } = render(<LogPanel isCustomQuery={false} />)
  await screen.findByPlaceholderText(/Search/)
  await screen.findByText('Now')
  rerender(<LogPanel isCustomQuery={true} />)
  await expect(screen.findByPlaceholderText(/Search/)).rejects.toThrow()
  await expect(screen.findByText('Now')).rejects.toThrow()
  await expect(screen.findByText('Custom')).rejects.toThrow()
})
