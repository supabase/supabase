'use client'

import React from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const generateStorageData = () => {
  return Array.from({ length: 7 }, (_, i) => ({
    time: `May ${10 + i}, 14:00`,
    storage: Math.floor(Math.random() * 100 + 69),
  }))
}

const StorageChart = () => {
  const data = generateStorageData()

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="storage" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export default StorageChart
