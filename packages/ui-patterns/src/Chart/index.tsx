'use client'

import * as React from 'react'
import { useContext } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Button, Card, Tooltip, TooltipContent, TooltipTrigger, cn } from 'ui'
import { HelpCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

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
  children: React.ReactNode
}

const ChartHeader = React.forwardRef<HTMLDivElement, ChartHeaderProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'py-4 px-6 flex flex-row items-center justify-between gap-2 space-y-0 pb-0 border-b-0 relative',
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
              <HelpCircle size={14} strokeWidth={1.5} className="text-foreground-light" />
            </TooltipTrigger>
            <TooltipContent>{tooltip}</TooltipContent>
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

/* Chart Content */
interface ChartContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  isEmpty?: boolean
  emptyState?: React.ReactNode
  loadingState?: React.ReactNode
}

const ChartContent = React.forwardRef<HTMLDivElement, ChartContentProps>(
  ({ children, className, isEmpty = false, emptyState, loadingState, ...props }, ref) => {
    const { isLoading } = useChart()

    return (
      <div ref={ref} className={cn('px-6 pt-4 pb-6', className)} {...props}>
        {isLoading ? loadingState : isEmpty ? emptyState : children}
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
const ChartLoadingState = () => {
  return (
    <div className="h-40 border border-dashed border-control items-center justify-center flex flex-col">
      <Loader2 size={20} className="animate-spin text-foreground-muted" />
    </div>
  )
}
ChartLoadingState.displayName = 'ChartLoadingState'

/* Exports */
export {
  Chart,
  ChartCard,
  ChartHeader,
  ChartTitle,
  ChartActions,
  ChartContent,
  ChartEmptyState,
  ChartLoadingState,
}
