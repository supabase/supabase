import { screen } from '@testing-library/react'
import ReportWidget from 'components/interfaces/Reports/ReportWidget'
import { render } from '../../helpers'

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
