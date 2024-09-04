'use client'

import MotionNumber from 'motion-number'
import { useEffect, useState } from 'react'
import { PolarGrid, RadialBar, RadialBarChart } from 'recharts'
import { Card, CardContent, ChartConfig, ChartContainer } from 'ui'
export const description = 'A radial chart with text'

const chartData = [{ timeRemaining: 100, fill: 'var(--color-timeRemaining)' }]

const handData = [{ hand: 100, fill: 'var(--color-hand)' }]

const chartConfig = {
  timeRemaining: {
    label: 'timeRemaining',
    color: 'hsl(var(--chart-1))',
  },
  hand: {
    label: 'hand',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function DiskCountdownRadial(props: any) {
  const TOTAL_TIME = 20 // 6 hours in seconds
  const [remainingTime, setRemainingTime] = useState(TOTAL_TIME)

  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingTime((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer)
          return 0
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const hours = Math.floor(remainingTime / 3600)
  const minutes = Math.floor((remainingTime % 3600) / 60)
  const seconds = remainingTime % 60

  const progressPercentage = (remainingTime / TOTAL_TIME) * 100

  return (
    <Card className="" {...props}>
      <CardContent className="py-3 flex gap-3 px-3 items-center">
        <div className="relative w-12 h-12">
          {/* timer ring */}
          <ChartContainer config={chartConfig} className="absolute w-12 h-12">
            <RadialBarChart
              data={[{ timeRemaining: 100, fill: 'var(--color-timeRemaining)' }]}
              startAngle={90}
              endAngle={90 - (progressPercentage * 360) / 100}
              innerRadius={21}
              outerRadius={14}
            >
              <PolarGrid
                gridType="circle"
                radialLines={false}
                stroke="none"
                className="first:fill-foreground-muted/50 last:fill-background-200"
                polarRadius={[16, 11]}
              />
              <RadialBar dataKey="timeRemaining" cornerRadius={2} />
            </RadialBarChart>
          </ChartContainer>

          <ChartContainer config={chartConfig} className="absolute top-1 left-1 w-10 h-10">
            <RadialBarChart
              data={[{ hand: 100, fill: 'var(--color-hand)' }]}
              // Adjust the angles to create a small hand
              startAngle={80 - (progressPercentage * 360) / 100}
              endAngle={140 - (progressPercentage * 360) / 100}
              innerRadius={14}
              outerRadius={5}
            >
              <RadialBar dataKey="hand" cornerRadius={2} isAnimationActive={true} />
            </RadialBarChart>
          </ChartContainer>
        </div>
        <div className="flex flex-col">
          <p className="text-foreground-lighter text-sm p-0">
            6-hour wait period between disk modifications.
          </p>
          <span className="text-foreground text-sm font-mono">
            <MotionNumber
              // always double digit
              format={{ minimumIntegerDigits: 2 }}
              value={hours.toString().padStart(2, '0')}
              transition={{
                y: { type: 'spring', duration: 0.35, bounce: 0 },
              }}
            />
            hr
            <MotionNumber
              // always double digit
              format={{ minimumIntegerDigits: 2 }}
              value={minutes.toString().padStart(2, '0')}
              transition={{
                y: { type: 'spring', duration: 0.35, bounce: 0 },
              }}
            />
            m
            <MotionNumber
              // always double digit
              format={{ minimumIntegerDigits: 2 }}
              value={seconds.toString().padStart(2, '0')}
              transition={{
                y: { type: 'spring', duration: 0.35, bounce: 0 },
              }}
            />
            s
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
