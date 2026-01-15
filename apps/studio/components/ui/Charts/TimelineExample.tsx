'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from 'ui'

// Sample data for the timeline chart
const data = [
  { name: 'documentLoad', start: 0, duration: 200 },
  { name: 'documentFetch', start: 0, duration: 50 },
  { name: 'resourceFetch', start: 30, duration: 30 },
  { name: 'resourceFetch', start: 40, duration: 25 },
  { name: 'resourceFetch', start: 100, duration: 50 },
  { name: 'resourceFetch', start: 150, duration: 30 },
  { name: 'DOMContentLoaded', start: 180, duration: 10 },
  { name: 'onload', start: 195, duration: 5 },
]

// Define chart configuration with colors for each item type
const chartConfig: ChartConfig = {
  documentLoad: {
    label: 'Document Load',
    color: '#10B981', // green
  },
  documentFetch: {
    label: 'Document Fetch',
    color: '#10B981', // green
  },
  resourceFetch: {
    label: 'Resource Fetch',
    color: '#3B82F6', // blue
  },
  DOMContentLoaded: {
    label: 'DOM Content Loaded',
    color: '#EF4444', // red
  },
  onload: {
    label: 'onLoad',
    color: '#F97316', // orange
  },
}

const TimelineExample = () => {
  // Transform data for horizontal bar chart
  const transformedData = data.map((item) => ({
    ...item,
    // Create a property for each type to show correct colors
    [item.name]: item.duration,
  }))

  // Compute max time for chart domain
  const maxTime = Math.max(...data.map((item) => item.start + item.duration))

  // Custom bar renderer to position bars at the correct start position
  const renderCustomBar = (props: any) => {
    const { x, y, width, height, fill, dataKey, index } = props
    const item = data[index]

    // Calculate position and width based on timeline data
    const fullWidth = width / (maxTime || 1)
    const barWidth = item.duration * fullWidth
    const barX = x + item.start * fullWidth

    // Debug width
    console.log(`Bar ${item.name}: width=${barWidth}px`)

    // Make threshold much smaller to show more text
    const showText = barWidth > 15

    return (
      <g>
        {/* The bar itself */}
        <rect x={barX} y={y} width={barWidth} height={height} fill={fill} rx={2} ry={2} />

        {/* Show text for all bars except the tiniest ones */}
        {showText && (
          <text
            x={barX + 5}
            y={y + height / 2 + 4}
            fill="white"
            fontSize={10}
            fontWeight="bold"
            style={{
              textShadow: '0px 0px 2px rgba(0,0,0,0.7)',
              pointerEvents: 'none',
            }}
          >
            {item.name}
          </text>
        )}
      </g>
    )
  }

  return (
    <div className="p-4">
      <h2 className="text-lg font-medium mb-4">Page Load Timeline</h2>

      <div className="mb-4" style={{ height: '300px' }}>
        <ChartContainer config={chartConfig}>
          <BarChart
            layout="vertical"
            data={transformedData}
            margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
            barGap={4}
          >
            <CartesianGrid horizontal={false} />
            <XAxis type="number" domain={[0, maxTime]} tickFormatter={(value) => `${value} ms`} />
            <YAxis type="category" dataKey="name" width={120} tickLine={false} />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name, entry) => (
                    <div>
                      <div>Start: {entry.payload.start} ms</div>
                      <div>Duration: {entry.payload.duration} ms</div>
                      <div>End: {entry.payload.start + entry.payload.duration} ms</div>
                    </div>
                  )}
                />
              }
            />
            {Object.keys(chartConfig).map((key) => (
              <Bar key={key} dataKey={key} shape={renderCustomBar} isAnimationActive={false} />
            ))}
          </BarChart>
        </ChartContainer>
      </div>

      <div className="text-sm text-foreground-lighter">
        <p>This timeline chart displays page load metrics in milliseconds.</p>
        <p>Click on a bar to see detailed information.</p>
      </div>
    </div>
  )
}

export default TimelineExample
