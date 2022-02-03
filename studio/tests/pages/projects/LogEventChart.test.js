import LogEventChart from 'components/interfaces/Settings/Logs/LogEventChart'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

jest.mock('components/ui/Flag/Flag')
import Flag from 'components/ui/Flag/Flag'
Flag.mockImplementation(({ children }) => <>{children}</>)
jest.mock('hooks')
import { useFlag } from 'hooks'
useFlag.mockReturnValue(true)

test('renders bars', async () => {
  const mockFn = jest.fn()
  const tsMicro = new Date().getTime() * 1000
  const { container } = render(
    <LogEventChart
      data={[{ timestamp: tsMicro }, { timestamp: { timestamp: tsMicro + 1 } }]}
      onBarClick={mockFn}
    />
  )
  // should only have one bar rendered
  const paths = container.querySelectorAll('path')
  expect(paths.length).toBe(1)
  userEvent.click(paths[0])
  expect(mock).toBeCalledTimes(1)
})
