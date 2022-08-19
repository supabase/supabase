import LogTable from 'components/interfaces/Settings/Logs/LogTable'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'

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
  await screen.findByText(/my_key/)
  await screen.findByText(/something_value/)
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

test('can display standard preview table columns', async () => {
  const fakeMicroTimestamp = dayjs().unix() * 1000
  render(
    <LogTable
      queryType="auth"
      data={[{ id: '12345', event_message: 'some event message', timestamp: fakeMicroTimestamp }]}
    />
  )
  await waitFor(() => screen.getByText(/some event message/))
  await expect(screen.findByText(/12345/)).rejects.toThrow()
  await expect(screen.findByText(fakeMicroTimestamp)).rejects.toThrow()
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

test('custom error message: Resources exceeded during query execution', async () => {
  const errorFromLogflare = {
    error: {
      code: 400,
      errors: [
        {
          domain: 'global',
          message:
            'Resources exceeded during query execution: The query could not be executed in the allotted memory. Peak usage: 122% of limit.\nTop memory consumer(s):\n  ORDER BY operations: 99%\n  other/unattributed: 1%\n',
          reason: 'resourcesExceeded',
        },
      ],
      message:
        'Resources exceeded during query execution: The query could not be executed in the allotted memory. Peak usage: 122% of limit.\nTop memory consumer(s):\n  ORDER BY operations: 99%\n  other/unattributed: 1%\n',
      status: 'INVALID_ARGUMENT',
    },
  }

  // logs explorer, custom query
  const { rerender } = render(<LogTable error={errorFromLogflare} />)

  // prompt user to reduce selected tables
  await screen.findByText(/This query requires too much memory to be executed/)
  await screen.findByText(
    /Avoid selecting entire objects and instead select specific keys using dot notation/
  )

  // previewer, prompt to reduce time range
  rerender(<LogTable queryType="api" error={errorFromLogflare} />)
  await screen.findByText(/This query requires too much memory to be executed/)
  await screen.findByText(/Avoid querying across a large datetime range/)
  await screen.findByText(/Please contact support if this error persists/)
})
