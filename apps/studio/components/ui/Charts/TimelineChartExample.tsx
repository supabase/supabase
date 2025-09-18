'use client'

import { useState } from 'react'
import TimelineChart, { TimelineChartDatum } from './TimelineChart'
import { CHART_COLORS } from './Charts.constants'

// Sample timeline data for page load metrics
const sampleData: TimelineChartDatum[] = [
  { id: 1, label: 'documentLoad', start: 0, duration: 200, color: CHART_COLORS.GREEN_1 },
  { id: 2, label: 'documentFetch', start: 0, duration: 50, color: CHART_COLORS.GREEN_2 },
  { id: 3, label: 'resourceFetch', start: 30, duration: 30, color: '#3870FF' },
  { id: 4, label: 'resourceFetch', start: 40, duration: 25, color: '#3870FF' },
  { id: 5, label: 'resourceFetch', start: 100, duration: 50, color: '#3870FF' },
  { id: 6, label: 'resourceFetch', start: 150, duration: 30, color: '#3870FF' },
  { id: 7, label: 'DOMContentLoaded', start: 180, duration: 10, color: CHART_COLORS.RED_1 },
  { id: 8, label: 'onload', start: 195, duration: 5, color: CHART_COLORS.RED_2 },
]

// Sample data for performance metrics - waterfall style
const performanceData: TimelineChartDatum[] = [
  { id: 1, label: 'DNS Lookup', start: 0, duration: 15, color: '#9F7AEA' },
  { id: 2, label: 'TCP Connection', start: 15, duration: 20, color: '#4C51BF' },
  { id: 3, label: 'TLS Handshake', start: 35, duration: 30, color: '#3182CE' },
  { id: 4, label: 'Time to First Byte', start: 65, duration: 25, color: '#38B2AC' },
  { id: 5, label: 'Content Download', start: 90, duration: 60, color: '#48BB78' },
  { id: 6, label: 'DOM Processing', start: 150, duration: 40, color: '#ECC94B' },
  { id: 7, label: 'Render', start: 190, duration: 35, color: '#ED8936' },
]

const TimelineChartExample = () => {
  const [selectedData, setSelectedData] = useState<TimelineChartDatum | null>(null)
  const [activeDataset, setActiveDataset] = useState<'page' | 'performance'>('page')

  // Handler for when a timeline item is clicked
  const handleBarClick = (entry: TimelineChartDatum) => {
    setSelectedData(entry)
  }

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Timeline Chart</h2>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded ${
              activeDataset === 'page' ? 'bg-foreground-light text-background' : 'bg-border'
            }`}
            onClick={() => setActiveDataset('page')}
          >
            Page Load
          </button>
          <button
            className={`px-3 py-1 rounded ${
              activeDataset === 'performance' ? 'bg-foreground-light text-background' : 'bg-border'
            }`}
            onClick={() => setActiveDataset('performance')}
          >
            Performance
          </button>
        </div>
      </div>

      <TimelineChart
        data={activeDataset === 'page' ? sampleData : performanceData}
        title={activeDataset === 'page' ? 'Page Load Timeline' : 'Performance Timeline'}
        format="ms"
        size="large"
        xAxisDomain={[0, 250]}
        showGrid={true}
        onBarClick={handleBarClick}
      />

      {selectedData && (
        <div className="mt-4 p-3 border rounded">
          <h3 className="font-medium mb-2">Selected Timeline Item</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Task:</div>
            <div className="font-mono">{selectedData.label}</div>
            <div>Start Time:</div>
            <div className="font-mono">{selectedData.start} ms</div>
            <div>Duration:</div>
            <div className="font-mono">{selectedData.duration} ms</div>
            <div>End Time:</div>
            <div className="font-mono">{selectedData.start + selectedData.duration} ms</div>
          </div>
        </div>
      )}

      <div className="mt-2 text-sm text-foreground-lighter">
        <p>
          This timeline chart displays {activeDataset === 'page' ? 'page load' : 'performance'}{' '}
          metrics in milliseconds.
        </p>
        <p>Click on a bar to see detailed information.</p>
      </div>
    </div>
  )
}

export default TimelineChartExample
