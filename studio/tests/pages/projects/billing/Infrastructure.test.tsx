import { get } from 'lib/common/fetch'
import { render } from '../../../helpers'
import { screen } from '@testing-library/react'
import Infrastructure from 'components/interfaces/BillingV2/Usage/Infrastructure'
beforeEach(() => {
  // reset mocks between tests
  ;(get as jest.Mock).mockReset()
  ;(get as jest.Mock).mockImplementation(async (_url: string) => {
    return [{ result: [] }]
  })
})

test(`renders category attributes static elements`, async () => {
  render(
    <Infrastructure
      projectRef={'someref'}
      startDate={new Date().toISOString()}
      endDate={new Date().toISOString()}
      currentBillingCycleSelected={false}
    />
  )
  // renders usage categories info
  await screen.findByText('Max CPU usage of your server')
})
