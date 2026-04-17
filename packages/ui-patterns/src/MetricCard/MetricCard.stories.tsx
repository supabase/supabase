import {
  MetricCard,
  MetricCardContent,
  MetricCardDifferential,
  MetricCardHeader,
  MetricCardIcon,
  MetricCardLabel,
  MetricCardSparkline,
  MetricCardValue,
} from '.'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { User2 } from 'lucide-react'
import { TooltipProvider } from 'ui'

const meta = {
  title: 'UI Patterns/MetricCard',
  component: MetricCard,
} satisfies Meta<typeof MetricCard>

export default meta

type Story = StoryObj<typeof meta>

const useData = () => {
  const now = new Date()
  const data = Array.from({ length: 12 }, (_, i) => ({
    value: Math.floor(4000 + i * 100 + (Math.random() * 2000 - 800)),
    timestamp: new Date(now.getTime() - (11 - i) * 60 * 60 * 1000).toISOString(),
  }))
  const averageValue = data.reduce((acc, curr) => acc + curr.value, 0) / data.length

  const diff = data[data.length - 1]?.value - data[0]?.value || 0
  const diffPercentage = (diff / averageValue) * 100

  return { averageValue, data, diffPercentage }
}

export const Minimal: Story = {
  render: () => {
    const { averageValue, diffPercentage } = useData()
    return (
      <TooltipProvider>
        <div className="w-1/2">
          <MetricCard>
            <MetricCardHeader href="https://www.supabase.io">
              <MetricCardLabel tooltip="The number of active users over the last 24 hours">
                Active Users
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue>
                {averageValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </MetricCardValue>
              <MetricCardDifferential variant={diffPercentage > 0 ? 'positive' : 'negative'}>
                {diffPercentage > 0 ? '+' : '-'}
                {Math.abs(diffPercentage).toFixed(1)}%
              </MetricCardDifferential>
            </MetricCardContent>
          </MetricCard>
        </div>
      </TooltipProvider>
    )
  },
}

export const MinimalHorizontal: Story = {
  render: () => {
    const { averageValue, diffPercentage } = useData()

    return (
      <TooltipProvider>
        <div className="w-1/2">
          <MetricCard>
            <MetricCardHeader href="https://www.supabase.io">
              <MetricCardLabel tooltip="The number of active users over the last 24 hours">
                Active Users
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent orientation="horizontal">
              <MetricCardValue>
                {averageValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </MetricCardValue>
              <MetricCardDifferential variant={diffPercentage > 0 ? 'positive' : 'negative'}>
                {diffPercentage > 0 ? '+' : '-'}
                {Math.abs(diffPercentage).toFixed(1)}%
              </MetricCardDifferential>
            </MetricCardContent>
          </MetricCard>
        </div>
      </TooltipProvider>
    )
  },
}

export const WithIconLinkTooltip: Story = {
  render: () => {
    const { averageValue, data, diffPercentage } = useData()

    return (
      <TooltipProvider>
        <div className="w-1/2">
          <MetricCard>
            <MetricCardHeader href="https://www.supabase.io">
              <MetricCardIcon>
                <User2 size={14} strokeWidth={1.5} />
              </MetricCardIcon>
              <MetricCardLabel tooltip="The number of active users over the last 24 hours">
                Active Users
              </MetricCardLabel>
            </MetricCardHeader>
            <MetricCardContent>
              <MetricCardValue>
                {averageValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </MetricCardValue>
              <MetricCardDifferential variant={diffPercentage > 0 ? 'positive' : 'negative'}>
                {diffPercentage > 0 ? '+' : '-'}
                {Math.abs(diffPercentage).toFixed(1)}%
              </MetricCardDifferential>
            </MetricCardContent>
            <MetricCardSparkline data={data} dataKey="value" />
          </MetricCard>
        </div>
      </TooltipProvider>
    )
  },
}
