'use client'

import { QueryResultChart } from 'surfaces/query'

export default function SurfacesResultChartEmpty() {
  return (
    <div className="flex h-56 w-full">
      <QueryResultChart title="Companies by industry" result={{ rows: [] }} />
    </div>
  )
}
