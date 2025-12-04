'use client'

import * as React from 'react'
import { useContext } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { Card, cn } from 'ui'

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

/* Chart Header */
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

/* Exports */
export { Chart, ChartCard, ChartHeader }
