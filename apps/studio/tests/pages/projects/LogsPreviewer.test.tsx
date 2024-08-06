import { vi } from 'vitest'
import { act, findByRole, findByText, fireEvent, screen, waitFor } from '@testing-library/react'
import { wait } from '@testing-library/user-event/dist/utils'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useRouter } from 'next/router'

dayjs.extend(utc)

import { useParams } from 'common'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { logDataFixture } from '../../fixtures'
import { render } from '../../helpers'

// [Joshen] There's gotta be a much better way to mock these things so that it applies for ALL tests
// Since these are easily commonly used things across all pages/components that we might be testing for
vi.mock('common', () => ({
  useParams: vi.fn().mockReturnValue({}),
  useIsLoggedIn: vi.fn(),
}))
vi.mock('lib/gotrue', () => ({
  auth: { onAuthStateChange: vi.fn() },
}))

// in the event that log metadata is not available, fall back to default renderer
// generate test cases for each query type
// const defaultRendererFallbacksCases = [
//   'api',
//   'database',
//   'auth',
//   'supavisor',
//   'postgrest',
//   'storage',
//   'realtime',
// ].map((queryType) => ({
//   testName: 'fallback to default render',
//   queryType,
//   tableName: undefined,
//   tableLog: logDataFixture({
//     event_message: 'some message',
//     metadata: undefined,
//   }),
//   selectionLog: logDataFixture({
//     metadata: undefined,
//   }),
//   tableTexts: [/some message/],
//   selectionTexts: [/some message/],
// }))

// test.skip.each([
//   {
//     queryType: 'api',
//     tableName: undefined,
//     tableLog: logDataFixture({
//       path: 'some-path',
//       method: 'POST',
//       status_code: '400',
//       metadata: undefined,
//     }),
//     selectionLog: logDataFixture({
//       metadata: [{ request: [{ method: 'POST' }] }],
//     }),
//     tableTexts: [/POST/, /some\-path/, /400/],
//     selectionTexts: [/POST/, /Timestamp/, RegExp(`${new Date().getFullYear()}.+`, 'g')],
//   },

//   {
//     queryType: 'database',
//     tableName: undefined,
//     tableLog: logDataFixture({
//       error_severity: 'ERROR',
//       event_message: 'some db event',
//       metadata: undefined,
//     }),
//     selectionLog: logDataFixture({
//       metadata: [
//         {
//           parsed: [
//             {
//               application_type: 'client backend',
//               error_severity: 'ERROR',
//               hint: 'some pg hint',
//             },
//           ],
//         },
//       ],
//     }),
//     tableTexts: [/ERROR/, /some db event/],
//     selectionTexts: [
//       /client backend/,
//       /some pg hint/,
//       /ERROR/,
//       /Timestamp/,
//       RegExp(`${new Date().getFullYear()}.+`, 'g'),
//     ],
//   },
//   {
//     queryType: 'auth',
//     tableName: undefined,
//     tableLog: logDataFixture({
//       event_message: 'some event_message',
//       level: 'info',
//       path: '/auth-path',
//       msg: 'some metadata_msg',
//       status: 300,
//       metadata: undefined,
//     }),
//     selectionLog: logDataFixture({
//       event_message: 'some event_message',
//       metadata: {
//         msg: 'some metadata_msg',
//         path: '/auth-path',
//         level: 'info',
//         status: 300,
//       },
//     }),
//     tableTexts: [/auth\-path/, /some metadata_msg/, /INFO/],
//     selectionTexts: [
//       /auth\-path/,
//       /some metadata_msg/,
//       /INFO/,
//       /300/,
//       /Timestamp/,
//       RegExp(`${new Date().getFullYear()}.+`, 'g'),
//     ],
//   },
//   ...defaultRendererFallbacksCases,
//   // these all use teh default selection/table renderers
//   ...['supavisor', 'postgrest', 'storage', 'realtime', 'supavisor'].map((queryType) => ({
//     queryType,
//     tableName: undefined,
//     tableLog: logDataFixture({
//       event_message: 'some message',
//       metadata: undefined,
//     }),
//     selectionLog: logDataFixture({
//       metadata: [{ some: [{ nested: 'value' }] }],
//     }),
//     tableTexts: [/some message/],
//     selectionTexts: [/some/, /nested/, /value/, RegExp(`${new Date().getFullYear()}.+`, 'g')],
//   })),
// ])(
//   'selection $queryType $queryType, $tableName , can display log data and metadata $testName',
//   async ({ queryType, tableName, tableLog, selectionLog, tableTexts, selectionTexts }) => {
//     render(<LogsPreviewer projectRef="123" queryType={queryType} tableName={tableName} />)
//     // reset mock so that we can check for selection call
//     get.mockClear()
//     for (const text of tableTexts) {
//       await screen.findByText(text)
//     }
//     const row = await screen.findByText(tableTexts[0])
//     fireEvent.click(row)
//     await waitFor(() => {
//       expect(get).toHaveBeenCalledWith(
//         expect.stringContaining('iso_timestamp_start'),
//         expect.anything()
//       )
//       expect(get).not.toHaveBeenCalledWith(
//         expect.stringContaining('iso_timestamp_end'),
//         expect.anything()
//       )
//     })
//     for (const text of selectionTexts) {
//       await screen.findAllByText(text)
//     }
//   }
// )

test.skip('Search will trigger a log refresh', async () => {
  render(<LogsPreviewer projectRef="123" queryType="auth" />)

  userEvent.type(screen.getByPlaceholderText(/Search events/), 'something{enter}')

  await waitFor(
    () => {
      // updates router query params
      const router = useRouter()
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: expect.any(String),
          query: expect.objectContaining({
            s: expect.stringContaining('something'),
          }),
        })
      )
    },
    { timeout: 1500 }
  )
  const table = await screen.findByRole('table')
  await findByText(table, /some-message/, { selector: '*' }, { timeout: 1500 })
})

test.skip('poll count for new messages', async () => {
  render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)
  await waitFor(() => screen.queryByText(/200/) === null)
  // should display new logs count
  await waitFor(() => screen.getByText(/999/))

  // Refresh button only exists with the queryType param, which no longer shows the id column
  userEvent.click(screen.getByTitle('refresh'))
  await waitFor(() => screen.queryByText(/999/) === null)
  await screen.findByText(/200/)
})

test.skip('stop polling for new count on error', async () => {
  render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)
  await waitFor(() => screen.queryByText(/some-uuid123/) === null)
  // should display error
  await screen.findByText(/some logflare error/)
  // should not load refresh counts if no data from main query
  await expect(screen.findByText(/999/)).rejects.toThrowError()
})

test.skip('log event chart', async () => {
  render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)

  await waitFor(() => screen.queryByText(/some-uuid123/) === null)
})

test.skip('s= query param will populate the search bar', async () => {
  // const router = routerMock
})

test.skip('te= query param will populate the timestamp to input', async () => {
  // get time 20 mins before
  // const newDate = new Date()
  // newDate.setMinutes(new Date().getMinutes() - 20)
  // const iso = newDate.toISOString()
  // const router = defaultRouterMock()
  // router.query = { ...router.query, ite: iso }
  // useRouter.mockReturnValue(router)
  // useParams.mockReturnValue(router.query)
  // render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)
  // await waitFor(() => {
  //   expect(get).toHaveBeenCalledWith(
  //     expect.stringContaining(`iso_timestamp_end=${encodeURIComponent(iso)}`),
  //     expect.anything()
  //   )
  // })
})

// test.skip('ts= query param will populate the timestamp from input', async () => {
//   // get time 20 mins before
//   const newDate = new Date()
//   newDate.setMinutes(new Date().getMinutes() - 20)
//   const iso = newDate.toISOString()
//   const router = defaultRouterMock()
//   router.query = { ...router.query, its: iso }
//   useRouter.mockReturnValue(router)
//   useParams.mockReturnValue(router.query)
//   render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)

//   await waitFor(() => {
//     expect(get).toHaveBeenCalledWith(
//       expect.stringContaining(`iso_timestamp_start=${encodeURIComponent(iso)}`),
//       expect.anything()
//     )
//   })
// })

// test.skip('load older btn will fetch older logs', async () => {
//   get.mockImplementation((url) => {
//     if (url.includes('count')) {
//       return {}
//     }
//     return {
//       result: [logDataFixture({ id: 'some-uuid123', status_code: 200, method: 'GET' })],
//     }
//   })
//   render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)
//   // should display first log but not second
//   await waitFor(() => screen.getByText('GET'))
//   await expect(screen.findByText('POST')).rejects.toThrow()
//   get.mockResolvedValueOnce({
//     result: [logDataFixture({ id: 'some-uuid234', status_code: 203, method: 'POST' })],
//   })
//   // should display first and second log
//   userEvent.click(await screen.findByText('Load older'))
//   await screen.findByText('GET')
//   await screen.findByText('POST')
//   expect(get).toHaveBeenCalledWith(expect.stringContaining('timestamp_end='), expect.anything())
// })

// test.skip('bug: load older btn does not error out when previous page is empty', async () => {
//   // bugfix for https://sentry.io/organizations/supabase/issues/2903331460/?project=5459134&referrer=slack
//   get.mockImplementation((url) => {
//     if (url.includes('count')) {
//       return {}
//     }
//     return { result: [] }
//   })
//   render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)
//   userEvent.click(await screen.findByText('Load older'))
//   // NOTE: potential race condition, since we are asserting that something DOES NOT EXIST
//   // wait for 500s to make sure all ui logic is complete
//   // need to wrap in act because internal react state is changing during this time.
//   await act(async () => await wait(100))
//   // clicking load older multiple times should not give error
//   await waitFor(() => {
//     expect(screen.queryByText(/Sorry/)).toBeNull()
//     expect(screen.queryByText(/An error occurred/)).toBeNull()
//     expect(screen.queryByText(/undefined/)).toBeNull()
//   })
// })

// test.skip('log event chart hide', async () => {
//   get.mockImplementation((url) => {
//     return { result: [] }
//   })
//   render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)
//   await screen.findByText(/No data/)
//   const toggle = await screen.findByText(/Chart/)
//   userEvent.click(toggle)
//   await expect(screen.findByText('Events')).rejects.toThrow()
// })

// test.skip('bug: nav backwards with params change results in ui changing', async () => {
//   // bugfix for https://sentry.io/organizations/supabase/issues/2903331460/?project=5459134&referrer=slack
//   get.mockImplementation((url) => {
//     if (url.includes('count')) {
//       return {}
//     }
//     return { data: [] }
//   })
//   const { container, rerender } = render(
//     <LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />
//   )
//   await expect(screen.findByDisplayValue('simple-query')).rejects.toThrow()
//   const router = defaultRouterMock()
//   router.query = { ...router.query, s: 'simple-query' }
//   useRouter.mockReturnValue(router)
//   useParams.mockReturnValue(router.query)
//   rerender(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)
//   await screen.findByDisplayValue('simple-query')
// })

// test.skip('bug: nav to explorer preserves newlines', async () => {
//   get.mockImplementation((url) => {
//     return { result: [] }
//   })
//   render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)
//   const button = screen.getByRole('link', { name: 'Explore via query' })
//   expect(button.href).toContain(encodeURIComponent('\n'))
// })

// test.skip('filters alter generated query', async () => {
//   render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)
//   userEvent.click(await screen.findByRole('button', { name: 'Status' }))
//   userEvent.click(await screen.findByText(/500 error codes/))
//   userEvent.click(await screen.findByText(/200 codes/))
//   userEvent.click(await screen.findByText(/Apply/))
//   await waitFor(() => {
//     // counts are adjusted
//     expect(get).toHaveBeenCalledWith(
//       expect.stringMatching(/count.+\*.+as.count.+where.+500.+599/),
//       expect.anything()
//     )
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('500'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('599'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('200'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('299'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('where'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('and'), expect.anything())
//   })

//   // should be able to clear the filters
//   userEvent.click(await screen.findByRole('button', { name: 'Status' }))
//   userEvent.click(await screen.findByRole('button', { name: 'Clear' }))
//   // get.mockClear()

//   userEvent.click(await screen.findByRole('button', { name: 'Status' }))
//   userEvent.click(await screen.findByText(/400 codes/))
//   userEvent.click(await screen.findByText(/Apply/))

//   await waitFor(() => {
//     // counts are adjusted
//     expect(get).not.toHaveBeenCalledWith(
//       expect.stringMatching(/count.+\*.+as.count.+where.+500.+599/),
//       expect.anything()
//     )
//     expect(get).toHaveBeenCalledWith(
//       expect.stringMatching(/count.+\*.+as.count.+where.+400.+499/),
//       expect.anything()
//     )
//     expect(get).not.toHaveBeenCalledWith(expect.stringContaining('500'), expect.anything())
//     expect(get).not.toHaveBeenCalledWith(expect.stringContaining('599'), expect.anything())
//     expect(get).not.toHaveBeenCalledWith(expect.stringContaining('200'), expect.anything())
//     expect(get).not.toHaveBeenCalledWith(expect.stringContaining('299'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('400'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('499'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('where'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('and'), expect.anything())
//   })
// })

// test.skip('filters accept filterOverride', async () => {
//   render(
//     <LogsPreviewer
//       queryType="api"
//       projectRef="123"
//       tableName={LogsTableName.FUNCTIONS}
//       filterOverride={{ 'my.nestedkey': 'myvalue' }}
//     />
//   )

//   await waitFor(() => {
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('my.nestedkey'), expect.anything())
//     expect(get).toHaveBeenCalledWith(expect.stringContaining('myvalue'), expect.anything())
//   })
// })

// describe.each(['free', 'pro', 'team', 'enterprise'])('upgrade modal for %s', (key) => {
//   beforeEach(() => {
//     useOrgSubscriptionQuery.mockReturnValue({
//       data: {
//         plan: {
//           id: key,
//         },
//       },
//     })
//   })
//   test.skip('based on query params', async () => {
//     const router = defaultRouterMock()
//     router.query = {
//       ...router.query,
//       q: 'some_query',
//       its: dayjs().subtract(4, 'months').toISOString(),
//       ite: dayjs().toISOString(),
//     }
//     useRouter.mockReturnValue(router)
//     useParams.mockReturnValue(router.query)
//     render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)
//     // await screen.findByText('Log retention') // assert modal title is present
//   })
// })

// test.skip('datepicker onChange will set the query params for outbound api request', async () => {
//   useOrgSubscriptionQuery.mockReturnValue({
//     data: {
//       plan: {
//         id: 'enterprise',
//       },
//     },
//   })
//   get.mockImplementation((url) => {
//     return { result: [] }
//   })
//   render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)
//   // renders time locally
//   userEvent.click(await screen.findByText('Custom'))
//   // inputs with local time
//   const toHH = await screen.findByDisplayValue('23')
//   userEvent.clear(toHH)
//   userEvent.type(toHH, '12')
//   userEvent.click(await screen.findByText('20'), { selector: '.react-datepicker__day' })
//   userEvent.click(await screen.findByText('21'), { selector: '.react-datepicker__day' })
//   userEvent.click(await screen.findByText('Apply'))
//   await waitFor(() => {
//     expect(get).toHaveBeenCalledWith(
//       expect.stringMatching(/.+select.+event_message.+iso_timestamp_end=/),
//       expect.anything()
//     )
//   })
// })
