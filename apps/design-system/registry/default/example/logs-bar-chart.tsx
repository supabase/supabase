import { LogsBarChart } from 'ui-patterns/LogsBarChart'

export default function LogsBarChartDemo() {
  const data = [
    {
      timestamp: '2024-01-01',
      error_count: 10,
      ok_count: 100,
    },
    {
      timestamp: '2024-01-02',
      error_count: 20,
      ok_count: 200,
    },
    {
      timestamp: '2024-01-03',
      error_count: 30,
      ok_count: 300,
    },
    {
      timestamp: '2024-01-04',
      error_count: 40,
      ok_count: 400,
    },
    {
      timestamp: '2024-01-05',
      error_count: 50,
      ok_count: 500,
    },
    {
      timestamp: '2024-01-06',
      error_count: 60,
      ok_count: 600,
    },
    {
      timestamp: '2024-01-07',
      error_count: 70,
      ok_count: 700,
    },
  ]

  return <LogsBarChart data={data} />
}
