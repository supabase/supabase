import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LogTable } from 'components/interfaces/Settings/Logs/LogTable'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import { beforeAll, expect, test, vi } from 'vitest'

import { render } from '../../helpers'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

beforeAll(() => {
  vi.mock('next/router', () => import('next-router-mock'))
  vi.mock('nuqs', async () => {
    let queryValue = 'example'
    return {
      useQueryState: () => [queryValue, (v: string) => (queryValue = v)],
    }
  })
})

const fakeMicroTimestamp = dayjs().unix() * 1000

const LOG_DATA = {
  id: 'some-uuid',
  timestamp: 1621323232312,
  event_message: 'event message',
  metadata: {
    my_key: 'something_value',
  },
}

test('can display log data', async () => {
  render(
    <>
      <LogTable projectRef="default" data={[LOG_DATA]} />
    </>
  )

  await screen.findAllByText(LOG_DATA.timestamp)
})

test('Shows total results', async () => {
  render(<LogTable projectRef="default" data={[LOG_DATA]} />)

  await screen.getByText(/results \(1\)/i)
})

test('can run if no queryType provided', async () => {
  const mockRun = vi.fn()

  render(
    <LogTable
      projectRef="projectRef"
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
      onRun={mockRun}
    />
  )

  const run = await screen.findByText('Run')
  await userEvent.click(run)
  // expect(mockRun).toBeCalled()
})

test('can run if no queryType provided', async () => {
  const mockRun = vi.fn()

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
      projectRef="abcd"
      onRun={mockRun}
    />
  )

  const run = await screen.findByText('Run')
  await userEvent.click(run)
  // expect(mockRun).toBeCalled()
})

test('dedupes log lines with exact id', async () => {
  // chronological mode requires 4 columns
  render(
    <LogTable
      projectRef="projectRef"
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
  await screen.findByText('timestamp')
})

test('can display standard preview table columns', async () => {
  render(
    <LogTable
      projectRef="ref"
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
    <LogTable
      projectRef="ref"
      queryType="auth"
      data={[{ id: '1', event_message: 'some event message', timestamp: fakeMicroTimestamp }]}
    />
  )
  const text = await screen.findByText(/some event message/)
  await userEvent.click(text)

  rerender(
    <LogTable
      projectRef="ref"
      queryType="auth"
      data={[{ id: '2', event_message: 'some other message', timestamp: fakeMicroTimestamp }]}
    />
  )
  await expect(screen.findByText(/some event message/)).rejects.toThrow()
  await screen.findByText(/some other message/)
})

enum QueryType {
  Functions = 'functions',
  Api = 'api',
  Auth = 'auth',
}
test.each([
  {
    queryType: QueryType.Functions,
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
    queryType: QueryType.Functions,
    data: [
      {
        event_message: 'This is a uncaughtExceptop\n',
        event_type: 'uncaughtException',
        function_id: '001b0b08-331c-403e-810c-a2004b03a019',
        timestamp: 1659545029083869,
        id: '4475cf6f-2929-4296-ab44-ce2c17069937',
        level: undefined,
      },
    ],
    includes: [/uncaughtException/],
    excludes: [/ERROR/],
  },
  {
    queryType: QueryType.Api,
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
    queryType: QueryType.Auth,
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
  render(<LogTable projectRef="ref" queryType={queryType} data={data} />)

  await Promise.all([
    ...includes.map((text) => screen.findByText(text)),
    ...excludes.map((text) => expect(screen.findByText(text)).rejects.toThrow()),
  ])
})

test('error message handling', async () => {
  // Render LogTable with error as a string
  render(<LogTable projectRef="ref" error={'some error message'} />)

  expect(screen.getByText(`some error message`)).toBeTruthy()

  // Rerender LogTable with error as null
  render(<LogTable projectRef="ref" error={null} />)
  // Add any additional assertions if LogTable behaves differently when error is null
})

test('no results message handling', async () => {
  render(<LogTable projectRef="ref" data={[]} />)
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
  const { rerender } = render(<LogTable projectRef="ref" error={errorFromLogflare} />)

  // prompt user to reduce selected tables
  await screen.findByText(/This query requires too much memory to be executed/)
  await screen.findByText(
    /Avoid selecting entire objects and instead select specific keys using dot notation/
  )

  // previewer, prompt to reduce time range
  rerender(<LogTable projectRef="ref" queryType="api" error={errorFromLogflare} />)
  await screen.findByText(/This query requires too much memory to be executed/)
  await screen.findByText(/Avoid querying across a large datetime range/)
  await screen.findByText(/Please contact support if this error persists/)
})
