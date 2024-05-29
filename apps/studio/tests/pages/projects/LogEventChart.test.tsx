import { vi } from 'vitest'

import LogEventChart from 'components/interfaces/Settings/Logs/LogEventChart'
import { screen } from '@testing-library/react'
import { render } from '../../helpers'

const { ResizeObserver } = window

beforeEach(() => {
  delete (window as any).ResizeObserver
  window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
})

afterEach(() => {
  window.ResizeObserver = ResizeObserver
})

test('renders chart', async () => {
  const mockFn = vi.fn()
  const tsMicro = new Date().getTime() * 1000
  render(
    <LogEventChart
      data={[
        { timestamp: tsMicro.toString(), count: 1 },
        { timestamp: (tsMicro + 1).toString(), count: 2 },
      ]}
      onBarClick={mockFn}
    />
  )
  await screen.findByText(/Logs \/ Time/)
})
