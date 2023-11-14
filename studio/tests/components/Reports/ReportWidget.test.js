import { get } from 'lib/common/fetch'
import { useRouter } from 'next/router'
import { screen } from '@testing-library/react'
import { render } from '../../helpers'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import userEvent from '@testing-library/user-event'
beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
})

test('static elements', async () => {
  render(<ReportWidget data={[]} title="Some chart" sql="select" renderer={() => 'something'} />)
  await screen.findByText(/something/)
  await screen.findByText(/Some chart/)
})

test('append', async () => {
  const appendable = () => 'some text'
  render(<ReportWidget data={[]} renderer={() => null} append={appendable} />)
  await screen.findByText(/some text/)
})
