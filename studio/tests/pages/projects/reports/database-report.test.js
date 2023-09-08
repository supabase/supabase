import { get } from 'lib/common/fetch'
import { render } from '../../../helpers'
import { screen } from '@testing-library/react'
import DatabaseReport from 'pages/project/[ref]/reports/database'

beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  get.mockImplementation(async (_url) => [{ result: [] }])
})

test(`static elements`, async () => {
  render(<DatabaseReport />)
  await screen.findByText('Database usage')
})

