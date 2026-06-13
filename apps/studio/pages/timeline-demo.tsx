import TimelineChart, { TimelineChartDatum } from 'components/ui/Charts/TimelineChart'
import { CHART_COLORS } from 'components/ui/Charts/Charts.constants'
import { NextPage } from 'next'
import { useState, useEffect } from 'react'

const TimelineDemoPage: NextPage = () => {
  // Sample timeline data with clear, visible labels
  const demoData: TimelineChartDatum[] = [
    { id: 1, label: 'Document Load', start: 0, duration: 200, color: CHART_COLORS.GREEN_1 },
    { id: 2, label: 'Document Fetch', start: 0, duration: 50, color: CHART_COLORS.GREEN_2 },
    { id: 3, label: 'Resource Fetch 1', start: 30, duration: 50, color: '#3870FF' },
    { id: 4, label: 'Resource Fetch 2', start: 100, duration: 80, color: '#3870FF' },
    { id: 5, label: 'DOM Content Loaded', start: 180, duration: 50, color: CHART_COLORS.RED_1 },
  ]

  // Calculate max end time for proper scaling
  const maxEndTime = Math.max(...demoData.map((item) => item.start + item.duration))

  // Add debugging on component mount
  useEffect(() => {
    console.log('Timeline data:', demoData)
    console.log('Max end time:', maxEndTime)
    console.log('Expected bar widths (in proportion):')
    demoData.forEach((item) => {
      console.log(
        `${item.label}: ${item.duration} / ${maxEndTime} = ${(item.duration / maxEndTime).toFixed(2)}`
      )
    })
  }, [])

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-8">Timeline Chart Demo</h1>

      <div className="flex flex-col gap-4 mb-6 p-4 border rounded bg-surface-100">
        <h2 className="text-lg font-medium">Debug Information</h2>
        <div className="grid grid-cols-4 gap-2 text-sm">
          <div className="font-semibold">Item</div>
          <div className="font-semibold">Start Time</div>
          <div className="font-semibold">Duration</div>
          <div className="font-semibold">End Time</div>

          {demoData.map((item) => (
            <>
              <div>{item.label}</div>
              <div>{item.start} ms</div>
              <div>{item.duration} ms</div>
              <div>{item.start + item.duration} ms</div>
            </>
          ))}
        </div>
        <div>Max End Time: {maxEndTime} ms</div>
      </div>

      <div className="max-w-4xl mx-auto">
        <TimelineChart
          data={demoData}
          title="Page Load Timeline"
          format="ms"
          size="large"
          barSize={30}
          barCategoryGap="5%"
          // Explicitly set the X-axis domain for proper scaling
          xAxisDomain={[0, maxEndTime]}
        />
      </div>
    </div>
  )
}

export default TimelineDemoPage
