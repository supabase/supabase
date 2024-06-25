'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const generateBarChartData = () => {
  return Array.from({ length: 120 }, (_, i) => ({
    time: `${14 + Math.floor(i / 4)}:${(i % 4) * 15}`,
    queries: Math.floor(Math.random() * 3000),
  }))
}

const QueriesChart = () => {
  const data = generateBarChartData()

  return (
    <div className="flex flex-col gap-2 grow">
      <div className="flex items-baseline gap-2">
        <h2 className="text-2xl font-mono font-extralight text-foreground">3,402</h2>
        <span className="text-xs font-mono text-foreground-lighter">Total Queries</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          data={data}
          className="[&_.recharts-bar-rectangle>path]:fill-foreground/50 [&_.recharts-bar-rectangle:last-of-type>path]:fill-foreground"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-border-secondary"
          />

          <XAxis dataKey="time" className="text-xs text-foreground-muted" />
          {/* <YAxis /> */}
          <Tooltip />
          <Bar dataKey="queries" className="border-b border-red-900" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default QueriesChart
