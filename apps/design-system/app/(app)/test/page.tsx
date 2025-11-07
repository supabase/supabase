'use client'

import { useEffect } from 'react'
import { BarChart, Bar } from 'recharts'

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
    <div className="p-20 bg-white">
      <h1 className="text-2xl mb-4">Raw Recharts Test</h1>
      <div className="border-4 border-green-500" style={{ width: '400px', height: '300px' }}>
        <BarChart width={400} height={300} data={data}>
          <Bar dataKey="value" fill="#ff0000" />
        </BarChart>
      </div>
      <p className="mt-4">If you see red bars above, recharts itself works</p>
    </div>
  )
}
