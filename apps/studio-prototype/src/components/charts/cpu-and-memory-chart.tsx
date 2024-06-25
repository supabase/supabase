'use client'

import React from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from 'recharts'

const generateCPUMemoryData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${14 + Math.floor(i / 4)}:${(i % 4) * 15}`,
    cpu: Math.floor(Math.random() * 100),
    memory: Math.floor(Math.random() * 100),
  }))
}

const CPUAndMemoryChart = () => {
  const data = generateCPUMemoryData()

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        {/* <CartesianGrid strokeDasharray="3 3" /> */}
        {/* <XAxis dataKey="time" /> */}
        {/* <YAxis /> */}
        <Tooltip />
        <Line type="monotone" dataKey="cpu" stroke="#8884d8" dot={true} />
        <Dot className="fill-red-900" />
        <Line type="monotone" dataKey="memory" stroke="#82ca9d" dot={true} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default CPUAndMemoryChart
