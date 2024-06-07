import { configure, fireEvent, prettyDOM, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { LogsExplorerPage } from 'pages/project/[ref]/logs/explorer/index'
import { render } from 'tests/helpers'
import router from 'next-router-mock'
import { createDynamicRouteParser } from 'next-router-mock/dist/dynamic-routes/next-12'
import mockRouter from 'next-router-mock'
import { click } from '@testing-library/user-event/dist/click'
import { wait } from '@testing-library/user-event/dist/utils'

beforeEach(() => {
  mockRouter.push('/project/ref/logs/explorer')

  // We need to tell mockRouter which dynamic routes to parse.
  router.useParser(createDynamicRouteParser(['/project/[ref]/logs/explorer']))
})

test('q= query param will populate the query input', async () => {
  router.query = { ...router.query, type: 'api', q: 'some_query' }

  render(<LogsExplorerPage dehydratedState={{}} />)
})

test('ite= and its= query param will populate the datepicker', async () => {
  const start = dayjs().subtract(1, 'day')
  const end = dayjs()
  router.query = {
    ...router.query,
    type: 'api',
    q: 'some_query',
    its: start.toISOString(),
    ite: end.toISOString(),
  }

  render(<LogsExplorerPage dehydratedState={{}} />)
})

test('Shows focused log on row click', async () => {
  render(<LogsExplorerPage dehydratedState={{}} />)
  const logsTable = await screen.findByTestId('logs-table')
  const runBtn = await screen.findByText('Run')
  click(runBtn)

  const rowValue = await screen.findByText(/2024-06-06T13:19:35.106000/)
  userEvent.click(rowValue)

  screen.logTestingPlaygroundURL(logsTable)

  expect(await screen.findByText(/world/)).toBeTruthy()
})

test('Can copy Raw log', async () => {
  console.log('🔵 copy raw log: ', mockRouter.query.ref)
  render(<LogsExplorerPage dehydratedState={{}} />)

  const logsTable = await screen.findByTestId('logs-table')
  expect(logsTable).toBeTruthy()

  const runBtn = await screen.findByText('Run')
  userEvent.click(runBtn)

  const rowValue = await screen.findByText(/2024-06-06T13:19:35.106000/)
  userEvent.click(rowValue)

  const rawTab = await screen.findByText('Raw')
  expect(rawTab).toBeTruthy()

  userEvent.click(rawTab)
})

test('query warnings', async () => {
  router.query = {
    ...router.query,
    q: 'some_query',
    its: dayjs().subtract(10, 'days').toISOString(),
    ite: dayjs().toISOString(),
  }

  render(<LogsExplorerPage dehydratedState={{}} />)
  await screen.findByText('1 warning')
})

test('field reference', async () => {
  render(<LogsExplorerPage dehydratedState={{}} />)
  userEvent.click(await screen.findByText('Field Reference'))
  await screen.findByText('metadata.request.cf.asOrganization')
})
