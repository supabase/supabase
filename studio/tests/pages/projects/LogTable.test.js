import LogTable from 'components/interfaces/Settings/Logs/LogTable'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
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

  await waitFor(() => screen.getByText(/happened/))
  const row = screen.getByText(/happened/)
  fireEvent.click(row)
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
  await screen.findByText(/happened/)
})

test('can display custom columns and headers based on data input', async () => {
  render(<LogTable data={[{ some_header: 'some_data', kinda: 123456 }]} />)
  await waitFor(() => screen.getByText(/some_header/))
  await waitFor(() => screen.getByText(/some_data/))
  await waitFor(() => screen.getByText(/kinda/))
  await waitFor(() => screen.getByText(/123456/))
})
