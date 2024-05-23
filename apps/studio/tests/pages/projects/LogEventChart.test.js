import LogEventChart from 'components/interfaces/Settings/Logs/LogEventChart'
import { screen } from '@testing-library/react'
import { render } from '../../helpers'

const { ResizeObserver } = window

beforeEach(() => {
  delete window.ResizeObserver
  window.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }))
})

afterEach(() => {
  window.ResizeObserver = ResizeObserver
  jest.restoreAllMocks()
})

test('renders chart', async () => {
  const mockFn = jest.fn()
  const tsMicro = new Date().getTime() * 1000
  render(
    <LogEventChart
      data={[{ timestamp: tsMicro }, { timestamp: tsMicro + 1 }]}
      onBarClick={mockFn}
    />
  )
  await screen.findByText(/Logs \/ Time/)
})
