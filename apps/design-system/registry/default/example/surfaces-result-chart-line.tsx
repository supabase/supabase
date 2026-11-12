'use client'

import { QueryResultChart } from 'surfaces/query'

import { hourlyTraffic } from './surfaces-sample-data'

export default function SurfacesResultChartLine() {
  return (
    <div className="flex h-72 w-full">
      <QueryResultChart
        title="Requests and errors"
        chart={{
          type: 'line',
          x_column: 'timestamp',
          y_series: ['requests', 'errors'],
          cumulative: false,
          scale: 'linear',
          show_labels: false,
        }}
        result={{ rows: hourlyTraffic }}
      />
    </div>
  )
}
