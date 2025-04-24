import TimelineChart, { TimelineChartDatum } from 'components/ui/Charts/TimelineChart'
import { CHART_COLORS } from 'components/ui/Charts/Charts.constants'
import { NextPage } from 'next'

const TimelineDemoPage: NextPage = () => {
  // Sample timeline data with clear, visible labels
  const demoData: TimelineChartDatum[] = [
    { id: 1, label: 'Document Load', start: 0, duration: 200, color: CHART_COLORS.GREEN_1 },
    { id: 2, label: 'Document Fetch', start: 50, duration: 50, color: CHART_COLORS.GREEN_2 },
    { id: 3, label: 'Resource Fetch 1', start: 30, duration: 50, color: '#3870FF' },
    { id: 4, label: 'Resource Fetch 2', start: 100, duration: 80, color: '#3870FF' },
    { id: 5, label: 'Resource Fetch 3', start: 100, duration: 400, color: '#3870FF' },
    { id: 6, label: 'DOM Content Loaded', start: 180, duration: 100, color: CHART_COLORS.RED_1 },
  ]

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-8">Timeline Chart Demo</h1>
      <div className="relative">
        <TimelineChart data={demoData} title="Page Load Timeline" format="ms" size="large" />
      </div>
    </div>
  )
}

export default TimelineDemoPage
