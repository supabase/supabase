import TimelineChartExample from 'components/ui/Charts/TimelineChartExample'
import { NextPage } from 'next'

const TimelineDemoPage: NextPage = () => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-8">Timeline Chart Demo</h1>
      <div className="max-w-4xl mx-auto">
        <TimelineChartExample />
      </div>
    </div>
  )
}

export default TimelineDemoPage
