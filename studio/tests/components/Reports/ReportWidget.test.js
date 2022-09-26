// mock the fetch function
jest.mock('lib/common/fetch')
import { get } from 'lib/common/fetch'

// mock mobx
jest.mock('mobx-react-lite')
import { observer } from 'mobx-react-lite'
observer.mockImplementation((v) => v)

// mock the router
jest.mock('next/router')
import { useRouter } from 'next/router'
const defaultRouterMock = () => {
  const router = jest.fn()
  router.query = {}
  router.push = jest.fn()
  router.pathname = 'logs/path'
  return router
}
useRouter.mockReturnValue(defaultRouterMock())

// mock usage flags
jest.mock('components/ui/Flag/Flag')
import Flag from 'components/ui/Flag/Flag'
Flag.mockImplementation(({ children }) => <>{children}</>)
jest.mock('hooks')
import { useFlag } from 'hooks'
useFlag.mockReturnValue(true)

import { render, fireEvent, waitFor, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { wait } from '@testing-library/user-event/dist/utils'
import { logDataFixture } from '../../fixtures'
import { LogsTableName } from 'components/interfaces/Settings/Logs'
import { Presets } from 'components/interfaces/Reports/Reports.types'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { clickDropdown } from 'tests/helpers'
beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  useRouter.mockReset()
  useRouter.mockReturnValue(defaultRouterMock())
})

test('static elements', async () => {
  render(<ReportWidget data={[]} title="Some chart" sql="select" renderer={() => 'something'} />)
  await screen.findByText(/Some chart/)
  await screen.findByText(/something/)
  const moreBtn = await screen.findByTitle(/Actions\.\.\./)
  clickDropdown(moreBtn)
  await screen.findByText(/Open in Logs Explorer/)
})
