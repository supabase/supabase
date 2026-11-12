'use client'

import { QueryResultChart } from 'surfaces/query'

import { companiesByIndustry } from './surfaces-sample-data'

export default function SurfacesResultChart() {
  return (
    <div className="flex h-72 w-full">
      <QueryResultChart
        title="Companies by industry"
        chart={{
          type: 'bar',
          x_column: 'industry',
          y_series: ['companies'],
          cumulative: false,
          scale: 'linear',
          show_labels: true,
        }}
        result={{ rows: companiesByIndustry }}
      />
    </div>
  )
}
