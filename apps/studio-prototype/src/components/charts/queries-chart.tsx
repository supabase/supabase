'use client'

import React, { useRef, useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Generate initial data with timestamps, query values, and unique IDs
const generateInitialBarChartData = () => {
  return Array.from({ length: 120 }, (_, i) => ({
    id: i,
    time: `${14 + Math.floor(i / 4)}:${String((i % 4) * 15).padStart(2, '0')}`,
    queries: Math.floor(Math.random() * 3000),
  }))
}

// Calculate the next time value based on the last data point
const getNextTime = (lastTime) => {
  const [hours, minutes] = lastTime.split(':').map(Number)
  const newMinutes = (minutes + 15) % 60
  const newHours = newMinutes === 0 ? hours + 1 : hours
  return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
}

const QueriesChart = () => {
  const [data, setData] = useState(generateInitialBarChartData())
  const dataRef = useRef(data)

  useEffect(() => {
    const interval = setInterval(() => {
      const lastDataPoint = dataRef.current[dataRef.current.length - 1]
      const newTime = getNextTime(lastDataPoint.time)
      const newQueries = Math.floor(Math.random() * 3000)
      const newData = [
        ...dataRef.current.slice(1),
        { id: lastDataPoint.id + 1, time: newTime, queries: newQueries },
      ]
      dataRef.current = newData
      setData(newData)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  console.log('render')
  console.log(data)

  return (
    <div className="flex flex-col gap-2 grow">
      <div className="flex items-baseline gap-2">
        <h2 className="text-2xl font-mono font-extralight text-foreground">3,402</h2>
        <span className="text-xs font-mono text-foreground-lighter">Total Queries</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart
          width={200}
          height={200}
          data={data}
          barGap={4}
          className="[&_.recharts-bar-rectangle>path]:fill-foreground/50 [&_.recharts-bar-rectangle:last-of-type>path]:fill-foreground"
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          {/* <XAxis dataKey="time" className="text-xs text-foreground-muted" /> */}
          <Tooltip />
          <Bar
            isAnimationActive={false}
            dataKey="queries"
            animationDuration={1000}
            maxBarSize={1.5}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default QueriesChart
