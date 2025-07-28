import { PolarGrid, RadialBar, RadialBarChart } from 'recharts'
import { ChartConfig, ChartContainer } from 'ui'

interface CountdownTimerRadialProps {
  progress: number
}

const chartConfig = {
  timeRemaining: {
    label: 'timeRemaining',
    color: 'hsl(var(--warning-default))',
  },
  hand: {
    label: 'hand',
    color: 'hsl(var(--warning-default))',
  },
} satisfies ChartConfig

const CountdownTimerRadial = ({ progress }: CountdownTimerRadialProps) => {
  return (
    <div className="relative w-12 h-12">
      {/* timer ring */}
      <ChartContainer config={chartConfig} className="absolute w-12 h-12">
        <RadialBarChart
          data={[{ timeRemaining: 100, fill: 'var(--color-timeRemaining)' }]}
          startAngle={90}
          endAngle={90 - (progress * 360) / 100}
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
          startAngle={80 - (progress * 360) / 100}
          endAngle={140 - (progress * 360) / 100}
          innerRadius={14}
          outerRadius={5}
        >
          <RadialBar dataKey="hand" cornerRadius={2} isAnimationActive={true} />
        </RadialBarChart>
      </ChartContainer>
    </div>
  )
}

export default CountdownTimerRadial
