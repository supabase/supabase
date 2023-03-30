import LogEventChart from 'components/interfaces/Settings/Logs/LogEventChart'
import { screen } from '@testing-library/react'
import { render } from '../../helpers'

import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

jest.mock('components/ui/Flag/Flag')
import Flag from 'components/ui/Flag/Flag'
Flag.mockImplementation(({ children }) => <>{children}</>)
jest.mock('hooks')
import { useFlag } from 'hooks'
useFlag.mockReturnValue(true)

test('renders chart', async () => {
  const mockFn = jest.fn()
  const tsMicro = new Date().getTime() * 1000
  render(
    <LogEventChart
      data={[{ timestamp: tsMicro }, { timestamp: tsMicro + 1 }]}
      onBarClick={mockFn}
    />
  )
  // TODO: figure out how to test rechart bar chart rendering, svg does not get rendered for some reason.
  // should only have one bar rendered
  // await waitFor(
  //   () => {
  //     const paths = container.querySelectorAll('path')
  //     console.log(paths)
  //     expect(paths.length).toBe(1)
  //   },
  //   { timeout: 1000 }
  // )
  // userEvent.click(paths[0])
  // expect(mock).toBeCalledTimes(1)
  await screen.findByText(/Logs \/ Time/)
})
