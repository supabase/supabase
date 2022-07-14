import LogTable from 'components/interfaces/Settings/Logs/LogTable'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
test('can display log data', async () => {
  render(
    <LogTable
      data={[
        {
          id: 'some-uuid',
          timestamp: 1621323232312,
          event_message: 'some event happened',
          metadata: {
            my_key: 'something_value',
          },
        },
      ]}
    />
  )

  const row = await screen.findByText(/some-uuid/)
  userEvent.click(row)
  await waitFor(() => screen.getByText(/my_key/))
  await waitFor(() => screen.getByText(/something_value/))
})

test('dedupes log lines with exact id', async () => {
  // chronological mode requires 4 columns
  render(
    <LogTable
      data={[
        {
          id: 'some-uuid',
          timestamp: 1621323232312,
          event_message: 'some event happened',
          metadata: {},
        },
        {
          id: 'some-uuid',
          timestamp: 1621323232312,
          event_message: 'some event happened',
          metadata: {},
        },
      ]}
    />
  )

  // should only have one element, this line will fail if there are >1 element
  await screen.findByText(/some-uuid/)
})

test('can display custom columns and headers based on data input', async () => {
  render(<LogTable data={[{ some_header: 'some_data', kinda: 123456 }]} />)
  await waitFor(() => screen.getByText(/some_header/))
  await waitFor(() => screen.getByText(/some_data/))
  await waitFor(() => screen.getByText(/kinda/))
  await waitFor(() => screen.getByText(/123456/))
})

test('toggle histogram', async () => {
  const mockFn = jest.fn()
  render(<LogTable onHistogramToggle={mockFn} isHistogramShowing={true} />)
  const toggle = await screen.getByText(/Histogram/)
  userEvent.click(toggle)
  expect(mockFn).toBeCalled()
})

test('error message handling', async () => {
  const { rerender } = render(<LogTable error="some \nstring" />)
  await expect(screen.findByText('some \nstring')).rejects.toThrow()
  await screen.findByDisplayValue(/some/)
  await screen.findByDisplayValue(/string/)

  rerender(<LogTable error={{ my_error: 'some \nstring' }} />)
  await screen.findByText(/some \\nstring/)
  await screen.findByText(/some/)
  await screen.findByText(/string/)
  await screen.findByText(/my_error/)
})
