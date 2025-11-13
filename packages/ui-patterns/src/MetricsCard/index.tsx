'use client'

import * as React from 'react'
import { useContext } from 'react'
import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Card,
  CardTitle,
  cn,
  CardContent,
  Skeleton,
} from 'ui'
import { ExternalLink, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  TooltipProps as RechartsTooltipProps,
} from 'recharts'
import dayjs from 'dayjs'

interface MetricsCardContextValue {
  isLoading?: boolean
  isDisabled?: boolean
}

const MetricsCardContext = React.createContext<MetricsCardContextValue>({
  isLoading: false,
  isDisabled: false,
})

const useMetricsCard = () => {
  return useContext(MetricsCardContext)
}

interface MetricsCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean
  isDisabled?: boolean
}

const MetricsCard = React.forwardRef<HTMLDivElement, MetricsCardProps>(
  ({ isLoading = false, isDisabled = false, className, children, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn(className)} {...props}>
        <MetricsCardContext.Provider value={{ isLoading, isDisabled }}>
          {children}
        </MetricsCardContext.Provider>
      </Card>
    )
  }
)
MetricsCard.displayName = 'MetricsCard'

interface MetricsCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  hasLink?: boolean
  href?: string
  children: React.ReactNode
}

const MetricsCardHeader = React.forwardRef<HTMLDivElement, MetricsCardHeaderProps>(
  ({ className, hasLink = false, href, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'py-4 px-6 flex flex-row items-center justify-between gap-2 space-y-0 pb-0 border-b-0 relative',
          className
        )}
        {...props}
      >
        <div className="flex flex-row items-center gap-2">{children}</div>
        {hasLink && (
          <Button type="text" size="tiny" className="px-1 text-foreground-lighter" asChild>
            <Link href={href || ''}>
              <ExternalLink size={14} strokeWidth={1.5} />
            </Link>
          </Button>
        )}
      </div>
    )
  }
)
MetricsCardHeader.displayName = 'MetricsCardHeader'

interface MetricsCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

const MetricsCardContent = React.forwardRef<HTMLDivElement, MetricsCardContentProps>(
  ({ className, orientation = 'vertical', ...props }, ref) => (
    <CardContent
      ref={ref}
      className={cn(
        'pb-4 px-6 pt-0 flex-1 flex h-full items-start gap-1 overflow-hidden border-b-0',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col ',
        className
      )}
      {...props}
    />
  )
)
MetricsCardContent.displayName = 'MetricsCardContent'

const MetricsCardIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-foreground-light', className)} {...props} />
  )
)
MetricsCardIcon.displayName = 'MetricsCardIcon'

interface MetricsCardLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  hasTooltip?: boolean
  tooltip?: string
  children: React.ReactNode
}

const MetricsCardLabel = React.forwardRef<HTMLDivElement, MetricsCardLabelProps>(
  ({ className, hasTooltip = false, tooltip, children, ...props }, ref) => {
    return (
      <CardTitle
        ref={ref}
        className={cn('flex items-center gap-2 text-foreground-light', className)}
        {...props}
      >
        <span>{children}</span>
        {hasTooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle size={14} strokeWidth={1.5} />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </CardTitle>
    )
  }
)
MetricsCardLabel.displayName = 'MetricsCardLabel'

const MetricsCardValue = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isLoading } = useMetricsCard()

    if (isLoading) {
      return <Skeleton className="w-32 h-7" />
    }

    return (
      <span ref={ref} className={cn('font-normal text-xl tabular-nums', className)} {...props} />
    )
  }
)

MetricsCardValue.displayName = 'MetricsCardValue'

interface MetricsCardDifferentialProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'positive' | 'negative' | 'default'
}

const MetricsCardDifferential = React.forwardRef<HTMLDivElement, MetricsCardDifferentialProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const { isLoading } = useMetricsCard()

    if (isLoading) {
      return <Skeleton className="w-16 h-5" />
    }

    return (
      <span
        ref={ref}
        className={cn(
          variant === 'positive'
            ? 'text-brand'
            : variant === 'negative'
              ? 'text-destructive'
              : 'text-foreground-light',
          'tabular-nums text-sm',
          className
        )}
        {...props}
      />
    )
  }
)

MetricsCardDifferential.displayName = 'MetricsCardDifferential'

const SparklineTooltip = ({ active, payload, label }: RechartsTooltipProps<any, any>) => {
  if (!active || !payload || !payload.length) return null

  const formatTimestamp = (timestamp: string) => {
    const date = dayjs(timestamp)
    const hour = date.hour()
    const period = hour >= 12 ? 'pm' : 'am'
    const displayHour = hour % 12 || 12

    return `${date.format('MMM D')}, ${displayHour}${period}`
  }

  return (
    <div className="bg-black/90 text-white p-2 rounded text-xs">
      {label && (
        <div className="text-foreground-light">{formatTimestamp(payload[0].payload.timestamp)}</div>
      )}
      <div>{payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
    </div>
  )
}
interface MetricsCardSparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: Array<{ value: number; [key: string]: any }>
  dataKey?: string
  className?: string
}

const MetricsCardSparkline = React.forwardRef<HTMLDivElement, MetricsCardSparklineProps>(
  ({ className, data, dataKey, ...props }, ref) => {
    const { isLoading } = useMetricsCard()
    if (isLoading) {
      return <Skeleton className="w-full h-[56px] rounded-none" />
    }

    if (!data || data.length === 0) {
      return null
    }

    return (
      <div ref={ref} className={cn('w-full h-16 relative', className)} {...props}>
        <ResponsiveContainer width="100%" height="100%" className="relative">
          <AreaChart data={data} margin={{ top: 5, left: 0, right: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--brand-default))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--brand-default))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <RechartsTooltip content={<SparklineTooltip />} />
            <Area
              type="step"
              dataKey={dataKey || 'value'}
              fill="url(#sparklineGradient)"
              fillOpacity={0.1}
              stroke="hsl(var(--brand-default))"
              strokeWidth={1.5}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }
)
MetricsCardSparkline.displayName = 'MetricsCardSparkline'

export {
  MetricsCard,
  MetricsCardHeader,
  MetricsCardIcon,
  MetricsCardLabel,
  MetricsCardContent,
  MetricsCardValue,
  MetricsCardDifferential,
  MetricsCardSparkline,
  useMetricsCard,
}
