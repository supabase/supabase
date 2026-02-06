'use client'

import dayjs from 'dayjs'
import { ChevronRight, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useContext } from 'react'
import {
  Area,
  AreaChart,
  Tooltip as RechartsTooltip,
  TooltipProps as RechartsTooltipProps,
  ResponsiveContainer,
} from 'recharts'
import {
  Button,
  Card,
  CardContent,
  CardTitle,
  cn,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

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
      <Card
        ref={ref}
        className={cn('group-hover:bg-surface-200 transition-colors', className)}
        {...props}
      >
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
  linkTooltip?: string
}

const MetricCardHeader = React.forwardRef<HTMLDivElement, MetricCardHeaderProps>(
  ({ className, href, children, linkTooltip, ...props }, ref) => {
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
        {href ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="text"
                size="tiny"
                className="px-1 text-foreground-lighter group-hover:text-foreground absolute right-3 transition-colors"
                asChild
              >
                <Link href={href}>
                  <ChevronRight aria-disabled={true} size={14} strokeWidth={1.5} />
                  <span className="sr-only">More information</span>
                </Link>
              </Button>
            </TooltipTrigger>
            {linkTooltip ? <TooltipContent>{linkTooltip}</TooltipContent> : null}
          </Tooltip>
        ) : null}
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
            <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
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
  className?: string
}

const MetricCardSparkline = React.forwardRef<HTMLDivElement, MetricCardSparklineProps>(
  ({ className, data, dataKey, ...props }, ref) => {
    const { isLoading } = useMetricCard()
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
