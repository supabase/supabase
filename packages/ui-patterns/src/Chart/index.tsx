'use client'

import { Slot } from '@radix-ui/react-slot'
import dayjs from 'dayjs'
import { HelpCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'
import { useContext, useMemo, useRef, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Tooltip as RechartsTooltip,
  TooltipProps as RechartsTooltipProps,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Button,
  Card,
  ChartContainer,
  cn,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

/* Chart Config */
export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<'light' | 'dark', string> } /* come back to this */
  )
}

/* Chart Context */
interface ChartContextValue {
  isLoading?: boolean
  isDisabled?: boolean
}

const ChartContext = React.createContext<ChartContextValue>({
  isLoading: false,
  isDisabled: false,
})

export const useChart = () => {
  return useContext(ChartContext)
}

/* Chart Base */
interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  isLoading?: boolean
  isDisabled?: boolean
  className?: string
}

const chartTableClasses = `[&_tr]:border-b [&_tr]:border-border [&_thead_tr]:!bg-transparent [&_thead_th]:!py-2 [&_thead_th]:!px-6 [&_thead_th]:h-auto [&_tbody_td]:py-2.5 [&_tbody_td]:px-6 [&_tbody_td]:text-xs [&_table]:mb-1 [&_table]:border-b [&_table]:border-border`

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  ({ children, isLoading = false, isDisabled = false, className, ...props }, ref) => {
    return (
      <ChartContext.Provider value={{ isLoading, isDisabled }}>
        <div ref={ref} className={cn('relative w-full', className)} {...props}>
          {children}
        </div>
      </ChartContext.Provider>
    )
  }
)
Chart.displayName = 'Chart'

/* Chart Card */
interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  children: React.ReactNode
  className?: string
}

const ChartCard = React.forwardRef<HTMLDivElement, ChartCardProps>(
  ({ children, className, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : Card
    return (
      <Comp ref={ref} className={cn('relative w-full', className)} {...props}>
        {children}
      </Comp>
    )
  }
)
ChartCard.displayName = 'ChartCard'

/* Chart Header Components */
interface ChartHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center'
  children: React.ReactNode
}

const ChartHeader = React.forwardRef<HTMLDivElement, ChartHeaderProps>(
  ({ children, className, align = 'center', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'py-4 px-6 flex flex-row justify-between gap-2 space-y-0 pb-0 border-b-0 relative',
          align === 'center' ? 'items-center' : 'items-start',
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
ChartHeader.displayName = 'ChartHeader'

interface ChartTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  tooltip?: string
}

const ChartTitle = React.forwardRef<HTMLDivElement, ChartTitleProps>(
  ({ children, className, tooltip, ...props }, ref) => {
    return (
      <h3 ref={ref} className={cn('h3 flex items-center gap-2', className)} {...props}>
        <span>{children}</span>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle
                size={14}
                strokeWidth={1.5}
                className="text-foreground-lighter hover:text-foreground-light transition-colors cursor-help"
              />
            </TooltipTrigger>
            <TooltipContent className="max-w-72">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </h3>
    )
  }
)
ChartTitle.displayName = 'ChartTitle'

export type ChartAction = {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  href?: string
  type?: 'button' | 'link'
  className?: string
}

interface ChartActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: ChartAction[]
  children?: React.ReactNode
}

const ChartActions = React.forwardRef<HTMLDivElement, ChartActionsProps>(
  ({ actions, children, className, ...props }, ref) => {
    if (children) {
      return (
        <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
          {children}
        </div>
      )
    }

    if (actions && actions.length > 0) {
      return (
        <div ref={ref} className={cn('flex items-center gap-2', className)} {...props}>
          {actions.map((action, index) => {
            const isLink = !!action.href

            return (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <Button
                    type="default"
                    size="tiny"
                    className={cn('px-1.5 text-foreground-lighter', action.className)}
                    onClick={action.onClick}
                    asChild={isLink}
                  >
                    {isLink ? (
                      <Link href={action.href!}>
                        {action.icon}
                        <span className="sr-only">{action.label}</span>
                      </Link>
                    ) : (
                      <>
                        {action.icon}
                        <span className="sr-only">{action.label}</span>
                      </>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{action.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </div>
      )
    }

    return null
  }
)
ChartActions.displayName = 'ChartActions'

/* Chart Metric */
interface ChartMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string
  value: string | number | null | undefined
  diffValue?: string | number | null | undefined
  status?: 'positive' | 'negative' | 'warning' | 'default'
  align?: 'start' | 'end'
  tooltip?: string
  className?: string
}

const ChartMetric = React.forwardRef<HTMLDivElement, ChartMetricProps>(
  ({ label, value, diffValue, className, status, align = 'start', tooltip, ...props }, ref) => {
    const { isLoading } = useChart()

    const { variant, formattedDiffValue } = useMemo(() => {
      if (diffValue === null || diffValue === undefined) {
        return { variant: 'default' as const, formattedDiffValue: null }
      }

      const numValue = typeof diffValue === 'string' ? parseFloat(diffValue) : diffValue

      if (isNaN(numValue)) {
        return { variant: 'default' as const, formattedDiffValue: String(diffValue) }
      }

      const variant: 'positive' | 'negative' | 'default' =
        numValue > 0 ? 'positive' : numValue < 0 ? 'negative' : 'default'

      const formattedDiffValue = numValue > 0 ? `+${diffValue}` : String(diffValue)

      return { variant, formattedDiffValue }
    }, [diffValue])

    return (
      <div
        ref={ref}
        className={cn(
          'flex gap-0.5 flex-col',
          align === 'start' ? 'items-start' : 'items-end',
          className
        )}
        {...props}
      >
        <div className="flex items-center gap-2">
          {status && (
            <span
              className={cn(
                'flex-shrink-0 w-1.5 h-1.5 rounded-full flex',
                status === 'positive' && 'bg-brand',
                status === 'negative' && 'bg-destructive',
                status === 'warning' && 'bg-warning',
                status === 'default' && 'bg-foreground-lighter'
              )}
            />
          )}
          <h3 className="text-xs font-mono uppercase flex items-center gap-1.5 text-foreground-light my-0">
            <span>{label}</span>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle
                    size={12}
                    strokeWidth={1.5}
                    className="text-foreground-lighter hover:text-foreground-light transition-colors cursor-help"
                  />
                </TooltipTrigger>
                <TooltipContent className="max-w-72">{tooltip}</TooltipContent>
              </Tooltip>
            )}
          </h3>
        </div>
        <span className="text-foreground text-xl tabular-nums">
          {isLoading ? <Skeleton className="w-12 h-6" /> : value}
        </span>
        {diffValue !== null && diffValue !== undefined && !isLoading && (
          <ChartValueDifferential variant={variant}>{formattedDiffValue}</ChartValueDifferential>
        )}
      </div>
    )
  }
)
ChartMetric.displayName = 'ChartMetric'

/* Chart Content */
interface ChartContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  isEmpty?: boolean
  emptyState?: React.ReactNode
  loadingState?: React.ReactNode
  disabledState?: React.ReactNode
  disabledActions?: ChartAction[]
}

const ChartContent = React.forwardRef<HTMLDivElement, ChartContentProps>(
  (
    {
      children,
      className,
      isEmpty = false,
      emptyState,
      loadingState,
      disabledState,
      disabledActions,
      ...props
    },
    ref
  ) => {
    const { isLoading, isDisabled } = useChart()
    let content: React.ReactNode

    if (isDisabled) {
      content = disabledState
    } else if (isLoading) {
      content = loadingState
    } else if (isEmpty) {
      content = emptyState
    } else {
      content = children
    }

    return (
      <div ref={ref} className={cn('px-6 pt-4 pb-6', chartTableClasses, className)} {...props}>
        {content}
      </div>
    )
  }
)
ChartContent.displayName = 'ChartContent'

/* Chart Empty State */
interface ChartEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  icon?: React.ReactNode
  title: string
  description: string
}

const ChartEmptyState = React.forwardRef<HTMLDivElement, ChartEmptyStateProps>(
  ({ className, icon, title, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'h-40 border border-dashed border-control items-center justify-center flex flex-col',
          className
        )}
        {...props}
      >
        {icon && (
          <div className="flex items-center justify-center w-6 h-6 text-foreground-lighter mb-1">
            {icon}
          </div>
        )}
        <h3 className="text-sm font-medium text-foreground-light">{title}</h3>
        <p className="text-sm text-foreground-lighter">{description}</p>
      </div>
    )
  }
)
ChartEmptyState.displayName = 'ChartEmptyState'

/* Chart Loading State */
const ChartLoadingState = ({ className }: { className?: string }) => {
  return (
    <div
      className={cn(
        'h-40 border border-dashed border-control items-center justify-center flex flex-col',
        className
      )}
    >
      <Loader2 size={20} className="animate-spin text-foreground-muted" />
    </div>
  )
}
ChartLoadingState.displayName = 'ChartLoadingState'

/* Chart Disabled State */
type ChartDisabledStateActions = {
  icon?: React.ReactNode
  label: string
  href?: string
  onClick?: () => void
  type?: 'button' | 'link'
  className?: string
}
interface ChartDisabledStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  label: string
  description: string
  actions?: ChartDisabledStateActions[]
}

const ChartDisabledState = ({ icon, label, description, actions }: ChartDisabledStateProps) => {
  const [isHoveringButton, setIsHoveringButton] = useState(false)
  const startDate = '2025-01-01'

  const getExpDemoChartData = useMemo(() => {
    return new Array(20).fill(0).map((_, index) => ({
      period_start: new Date(startDate).getTime() + index * 1000,
      demo: Math.floor(Math.pow(1.25, index) * 10),
      max_demo: 1000,
    }))
  }, [])

  const getDemoChartData = useRef(
    new Array(20).fill(0).map((_, index) => ({
      period_start: new Date(startDate).getTime() + index * 1000,
      demo: Math.floor(Math.random() * 10) + 1,
      max_demo: 1000,
    }))
  )

  const demoData = isHoveringButton ? getExpDemoChartData : getDemoChartData.current

  return (
    <>
      <div className="relative h-40">
        <ChartContainer
          config={
            {
              demo: {
                label: 'Demo',
                color: 'hsl(var(--brand-default))',
              },
            } satisfies ChartConfig
          }
          className="h-full w-full"
        >
          <BarChart data={demoData}>
            <XAxis dataKey="period_start" hide />
            <YAxis hide />
            <Bar dataKey="demo" fill="hsl(var(--brand-default))" />
          </BarChart>
        </ChartContainer>
      </div>
      <div className="absolute inset-0 bg-surface-100/80 backdrop-blur-md w-full h-full flex flex-col items-center justify-center">
        {icon && (
          <div className="flex items-center justify-center w-6 h-6 text-foreground-lighter mb-1">
            {icon}
          </div>
        )}
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <p className="text-sm text-foreground-light">{description}</p>
        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 mt-3">
            {actions.map((action, index) => (
              <Button
                key={index}
                type="primary"
                size="tiny"
                className={cn(action.className)}
                onClick={action.onClick}
                asChild={!!action.href}
                onMouseEnter={() => setIsHoveringButton(true)}
                onMouseLeave={() => setIsHoveringButton(false)}
              >
                {action.href ? <Link href={action.href}>{action.label}</Link> : <>{action.label}</>}
              </Button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
ChartDisabledState.displayName = 'ChartDisabledState'

/* Chart Footer */

interface ChartFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const ChartFooter = React.forwardRef<HTMLDivElement, ChartFooterProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('border-t', className, chartTableClasses)} {...props}>
        {children}
      </div>
    )
  }
)
ChartFooter.displayName = 'ChartFooter'

/* Metric Chart Components */
interface ChartValueDifferentialProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'positive' | 'negative' | 'default'
}

const ChartValueDifferential = React.forwardRef<HTMLDivElement, ChartValueDifferentialProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const { isLoading } = useChart()

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
ChartValueDifferential.displayName = 'ChartValueDifferential'

const ChartSparklineTooltip = ({ active, payload, label }: RechartsTooltipProps<any, any>) => {
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

interface ChartSparklineProps extends React.HTMLAttributes<HTMLDivElement> {
  data?: Array<{ value: number; [key: string]: any }>
  dataKey?: string
  className?: string
}

const ChartSparkline = React.forwardRef<HTMLDivElement, ChartSparklineProps>(
  ({ className, data, dataKey, ...props }, ref) => {
    if (!data || data.length === 0) {
      return null
    }

    return (
      <div ref={ref} className={cn('w-full h-24 pt-4 relative', className)} {...props}>
        <ResponsiveContainer width="100%" height="100%" className="relative">
          <AreaChart data={data} margin={{ top: 5, left: 0, right: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sparklineGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--brand-default))" stopOpacity={0.8} />
                <stop offset="95%" stopColor="hsl(var(--brand-default))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <RechartsTooltip content={<ChartSparklineTooltip />} />
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
ChartSparkline.displayName = 'ChartSparkline'

/* Exports */
export { ChartBar, type ChartBarProps, type ChartBarTick } from './charts/chart-bar'
export { ChartLine, type ChartLineProps, type ChartLineTick } from './charts/chart-line'
export {
  Chart,
  ChartActions,
  ChartCard,
  ChartContent,
  ChartDisabledState,
  ChartEmptyState,
  ChartFooter,
  ChartHeader,
  ChartLoadingState,
  ChartMetric,
  ChartSparkline,
  ChartSparklineTooltip,
  ChartTitle,
  ChartValueDifferential,
}
