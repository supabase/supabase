'use client'

import React, { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  Rectangle,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Function to generate random data
const generateRandomData = () => {
  const names = ['Page A', 'Page B', 'Page C', 'Page D', 'Page E', 'Page F', 'Page G']
  return names.map((name) => ({
    name,
    uv: Math.floor(Math.random() * 5000),
    pv: Math.floor(Math.random() * 5000),
    amt: Math.floor(Math.random() * 5000),
  }))
}

const Example = () => {
  const [data, setData] = useState(generateRandomData())

  useEffect(() => {
    const interval = setInterval(() => {
      setData(generateRandomData())
    }, 5000) // Update data every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-secondary" />
          <XAxis
            dataKey="name"
            className="text-xs stroke-border-secondary [&_text]:fill-foreground-muted"
          />
          <YAxis className="text-xs [&_line]:stroke-border-secondary [&_text]:fill-foreground-muted" />
          <Tooltip />
          {/* <Legend /> */}
          <Bar
            dataKey="pv"
            className="fill-foreground"
            activeBar={<Rectangle fill="pink" stroke="blue" />}
          />
          <Bar
            dataKey="uv"
            className="fill-foreground"
            activeBar={<Rectangle fill="gold" stroke="purple" />}
          />
        </BarChart>
      </ResponsiveContainer>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border-secondary" />
          <XAxis dataKey="name" className="text-xs [&_text]:fill-foreground-muted" />
          <YAxis className="text-xs [&_line]:stroke-border-secondary [&_text]:fill-foreground-muted" />
          <Tooltip />
          {/* <Legend /> */}
          <Bar
            dataKey="pv"
            className="fill-foreground"
            activeBar={<Rectangle fill="pink" stroke="blue" />}
          />
          <Bar
            dataKey="uv"
            className="fill-foreground"
            activeBar={<Rectangle fill="gold" stroke="purple" />}
          />
        </BarChart>
      </ResponsiveContainer>
    </>
  )
}

export default Example
