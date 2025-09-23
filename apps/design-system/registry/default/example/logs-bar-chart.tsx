import { LogsBarChart } from 'ui-patterns/LogsBarChart'

export default function LogsBarChartDemo() {
  const data = Array.from({ length: 100 }, (_, i) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() - i * 5) // Each point 5 minutes apart

    return {
      timestamp: date.toISOString(),
      ok_count: Math.floor(Math.random() * 100), // Random value 0-99
      error_count: Math.floor(Math.random() * 50), // Random value 0-50
      warning_count: Math.floor(Math.random() * 50), // Random value 0-50
    }
  }).reverse()

  return (
    <div className="w-full h-64">
      <LogsBarChart data={data} />
    </div>
  )
}
