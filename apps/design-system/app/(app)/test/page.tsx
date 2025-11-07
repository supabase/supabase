'use client'

import { useEffect } from 'react'
import { BarChart, Bar, ResponsiveContainer } from 'recharts'

export default function TestRecharts() {
  const data = [
    { name: 'A', value: 100 },
    { name: 'B', value: 200 },
    { name: 'C', value: 150 },
  ]

  useEffect(() => {
    console.log('🟠 Page mounted')
    console.log('🟠 data:', data)
  }, [])

  return (
    <div className="p-20">
      <h1 className="text-2xl mb-4">Raw Recharts Test</h1>
      <div className="border-4 border-green-500" style={{ width: '400px', height: '300px' }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <Bar dataKey="value" fill="#ff0000" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-4">If you see red bars above, recharts itself works</p>
    </div>
  )
}
