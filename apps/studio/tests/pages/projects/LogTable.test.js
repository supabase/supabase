import LogTable from 'components/interfaces/Settings/Logs/LogTable'
import { waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { render } from '../../helpers'

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

  // render copy button
  userEvent.click(await screen.findByText('Copy'))
  await screen.findByText(/Copied/)
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

test("closes the selection if the selected row's data changes", async () => {
  const { rerender } = render(
    <LogTable queryType="auth" data={[{ id: '12345', event_message: 'some event message' }]} />
  )
  const text = await screen.findByText(/some event message/)
  userEvent.click(text)
  await screen.findByText('Copy')
  rerender(<LogTable data={[{ id: '12346', event_message: 'some other message' }]} />)
  await expect(screen.findByText(/some event message/)).rejects.toThrow()
  await screen.findByText(/some other message/)
})

test.each([
  {
    queryType: 'functions',
    data: [
      {
        event_message: 'This is a error log\n',
        event_type: 'log',
        function_id: '001b0b08-331c-403e-810c-a2004b03a019',
        level: 'error',
        timestamp: 1659545029083869,
        id: '3475cf6f-2929-4296-ab44-ce2c17069937',
      },
    ],
    includes: [/ERROR/],
    excludes: ['undefined', 'null'],
  },
  {
    queryType: 'functions',
    data: [
      {
        event_message: 'This is a uncaughtExceptop\n',
        event_type: 'uncaughtException',
        function_id: '001b0b08-331c-403e-810c-a2004b03a019',
        timestamp: 1659545029083869,
        id: '4475cf6f-2929-4296-ab44-ce2c17069937',
        level: null,
      },
    ],
    includes: [/uncaughtException/],
    excludes: [/ERROR/],
  },
  {
    queryType: 'api',
    data: [
      {
        event_message: 'This is a uncaughtException\n',
        path: 'this-is-some-path',
        method: 'POST',
        status_code: 500,
        timestamp: 1659545029083869,
        id: '4475cf6f-2929-4296-ab44-ce2c17069937',
      },
    ],
    includes: [/POST/, 'this-is-some-path'],
    excludes: [],
  },
  {
    queryType: 'auth',
    data: [
      {
        event_message: JSON.stringify({ msg: 'some message', path: '/auth-path', level: 'info' }),
        msg: 'some message',
        path: '/auth-path',
        level: 'info',
        timestamp: 1659545029083869,
        id: '4475cf6f-2929-4296-ab44-ce2c17069937',
      },
    ],
    includes: [/auth\-path/, /some message/, /INFO/],
    excludes: [/\{/, /\}/],
  },
])('table col renderer for $queryType', async ({ queryType, data, includes, excludes }) => {
  render(<LogTable queryType={queryType} data={data} />)

  await Promise.all([
    ...includes.map((text) => screen.findByText(text)),
    ...excludes.map((text) => expect(screen.findByText(text)).rejects.toThrow()),
  ])
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

test('no results message handling', async () => {
  render(<LogTable data={[]} />)
  await screen.findByText(/No results/)
  await screen.findByText(/Try another search/)
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
