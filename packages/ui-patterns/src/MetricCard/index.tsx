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

interface MetricCardContextValue {
  isLoading?: boolean
  isDisabled?: boolean
}

const MetricCardContext = React.createContext<MetricCardContextValue>({
  isLoading: false,
  isDisabled: false,
})

const useMetricCard = () => {
  return useContext(MetricCardContext)
}

interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  isLoading?: boolean
  isDisabled?: boolean
}

const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ isLoading = false, isDisabled = false, className, children, ...props }, ref) => {
    return (
      <Card ref={ref} className={cn(className)} {...props}>
        <MetricCardContext.Provider value={{ isLoading, isDisabled }}>
          {children}
        </MetricCardContext.Provider>
      </Card>
    )
  }
)
MetricCard.displayName = 'MetricCard'

interface MetricCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  href?: string
  children: React.ReactNode
}

const MetricCardHeader = React.forwardRef<HTMLDivElement, MetricCardHeaderProps>(
  ({ className, href, children, ...props }, ref) => {
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
        {href && (
          <Button type="text" size="tiny" className="px-1 text-foreground-lighter" asChild>
            <Link href={href}>
              <ExternalLink aria-disabled={true} size={14} strokeWidth={1.5} />
              <span className="sr-only">More information</span>
            </Link>
          </Button>
        )}
      </div>
    )
  }
)
MetricCardHeader.displayName = 'MetricCardHeader'

interface MetricCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

const MetricCardContent = React.forwardRef<HTMLDivElement, MetricCardContentProps>(
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
MetricCardContent.displayName = 'MetricCardContent'

const MetricCardIcon = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('text-foreground-light', className)} {...props} />
  )
)
MetricCardIcon.displayName = 'MetricCardIcon'

interface MetricCardLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  tooltip?: string
  children: React.ReactNode
}

const MetricCardLabel = React.forwardRef<HTMLDivElement, MetricCardLabelProps>(
  ({ className, tooltip, children, ...props }, ref) => {
    return (
      <CardTitle
        ref={ref}
        className={cn('flex items-center gap-2 text-foreground-light', className)}
        {...props}
      >
        <span>{children}</span>
        {tooltip && (
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
MetricCardLabel.displayName = 'MetricCardLabel'

const MetricCardValue = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { isLoading } = useMetricCard()

    if (isLoading) {
      return <Skeleton className="w-32 h-7" />
    }

    return (
      <span ref={ref} className={cn('font-normal text-xl tabular-nums', className)} {...props} />
    )
  }
)

MetricCardValue.displayName = 'MetricCardValue'

interface MetricCardDifferentialProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'positive' | 'negative' | 'default'
}

const MetricCardDifferential = React.forwardRef<HTMLDivElement, MetricCardDifferentialProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const { isLoading } = useMetricCard()

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

MetricCardDifferential.displayName = 'MetricCardDifferential'

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
        <div className="dark:text-foreground-light text-white/60">
          {formatTimestamp(payload[0].payload.timestamp)}
        </div>
      )}
      <div>{payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
    </div>
  )
}
interface MetricCardSparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: Array<{ value: number; [key: string]: any }>
  dataKey?: string
  hasTimestamp?: boolean
  className?: string
}

const MetricCardSparkline = React.forwardRef<HTMLDivElement, MetricCardSparklineProps>(
  ({ className, data, dataKey, hasTimestamp = false, ...props }, ref) => {
    const { isLoading } = useMetricCard()
    const DateTimeFormat = 'MMM D, YYYY'
    const startDate =
      data && data.length > 0 ? dayjs(data[0]['timestamp']).format(DateTimeFormat) : ''
    const endDate =
      data && data.length > 0
        ? dayjs(data[data.length - 1]?.['timestamp']).format(DateTimeFormat)
        : ''

    if (isLoading) {
      return <Skeleton className="w-full h-[56px] rounded-none" />
    }

    if (!data || data.length === 0) {
      return null
    }

    return (
      <div ref={ref} className={cn('w-full h-16 relative box-border', className)} {...props}>
        <ResponsiveContainer width="100%" height="100%" className="relative z-10">
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
        {hasTimestamp && (
          <div className="text-brand bottom-1 left-3 right-3 absolute z-0 flex items-center justify-between text-[10px] font-mono">
            <span>{startDate}</span>
            <span>{endDate}</span>
          </div>
        )}
      </div>
    )
  }
)
MetricCardSparkline.displayName = 'MetricCardSparkline'

export {
  MetricCard,
  MetricCardHeader,
  MetricCardIcon,
  MetricCardLabel,
  MetricCardContent,
  MetricCardValue,
  MetricCardDifferential,
  MetricCardSparkline,
  useMetricCard,
}
