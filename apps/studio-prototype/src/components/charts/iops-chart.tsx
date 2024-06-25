'use client'

import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const generateIOPSData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${14 + Math.floor(i / 4)}:${(i % 4) * 15}`,
    iops: Math.floor(Math.random() * 400),
  }))
}

const IOPSChart = () => {
  const data = generateIOPSData()

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="iops" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export default IOPSChart
