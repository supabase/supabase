import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

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

import { SWRConfig } from 'swr'
jest.mock('components/interfaces/Reports/PresetReport')
import PresetReport from 'components/interfaces/Reports/PresetReport'
PresetReport.mockImplementation((props) => {
  const Comp = jest.requireActual('components/interfaces/Reports/PresetReport').default
  // wrap with SWR to reset the cache each time
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        shouldRetryOnError: false,
      }}
    >
      <Comp {...props} />
    </SWRConfig>
  )
})

jest.mock('hooks')
import { useProjectSubscription } from 'hooks'
useProjectSubscription = jest.fn((ref) => ({
  subscription: {
    tier: {
      supabase_prod_id: 'tier_free',
    },
  },
}))

import { render, fireEvent, waitFor, screen, act } from '@testing-library/react'
import { Presets } from 'components/interfaces/Reports/Reports.types'
beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  useRouter.mockReset()
  useRouter.mockReturnValue(defaultRouterMock())
})

test('static elements', async () => {
  render(<PresetReport preset={Presets.OVERVIEW} />)
  await screen.findByText(/Last 7 days/)
  await screen.findAllByText(/API Usage/)
  await screen.findAllByText(/Refresh/)
})

test('changing date range triggers query refresh', async () => {
  render(<PresetReport preset={Presets.OVERVIEW} />)
  await waitFor(() => expect(get).toBeCalled())
  get.mockReset()
  const refresh = await screen.findByText(/Refresh/)
  fireEvent.click(refresh)
  await waitFor(() => expect(get).toBeCalled())
})
