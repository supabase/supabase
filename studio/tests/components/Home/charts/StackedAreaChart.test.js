import { render, screen } from '@testing-library/react'

import StackedAreaChart from 'components/ui/Charts/StackedAreaChart'

const MOCK_CHART_DATA = [
  {
    count: 8656,
    status_code: 503,
    timestamp: 1647777600000000,
  },
  {
    count: 2,
    status_code: 416,
    timestamp: 1647781200000000,
  },
  {
    count: 508621,
    status_code: 200,
    timestamp: 1647784800000000,
  },
  {
    count: 505478,
    status_code: 200,
    timestamp: 1647792000000000,
  },
  {
    count: 9,
    status_code: 416,
    timestamp: 1647795600000000,
  },
  {
    count: 2,
    status_code: 429,
    timestamp: 1647799200000000,
  },
  {
    count: 3,
    status_code: 416,
    timestamp: 1647802800000000,
  },
  {
    count: 1,
    status_code: 502,
    timestamp: 1647806400000000,
  },
]

// TODO: figure out how to test rechart charts, svg does not get rendered in jsdom
// test('bug: correctly formats unix timestamps ', async () => {
//   const { debug } = render(
//     <StackedAreaChart
//       stackKey="status_code"
//       xAxisKey="timestamp"
//       yAxisKey="count"
//       isLoading={false}
//       xAxisFormatAsDate
//       dateFormat="MMM D, ha"
//       data={MOCK_CHART_DATA}
//     />
//   )
//   debug()
//   await screen.findByText(/Mar/)
//   await expect(screen.findByText('Jul')).rejects.toThrow()
//   await expect(screen.findByText('Sep')).rejects.toThrow()
//   await expect(screen.findByText('Oct')).rejects.toThrow()
// })
