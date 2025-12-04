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
  config?: ChartConfig
  data?: any[] /* TODO: proper type */
  isLoading?: boolean
  isDisabled?: boolean
}

const ChartContext = React.createContext<ChartContextValue>({
  config: {},
  data: [],
  isLoading: false,
  isDisabled: false,
})

export const useChart = () => {
  return useContext(ChartContext)
}

/* Chart Base */
interface ChartProps extends React.HTMLAttributes<HTMLDivElement> {
  config?: ChartConfig
  children: React.ReactNode
  data: any[] /* TODO: proper type */
  isLoading?: boolean
  isDisabled?: boolean
  className?: string
}

const Chart = React.forwardRef<HTMLDivElement, ChartProps>(
  (
    { config = {}, children, data, isLoading = false, isDisabled = false, className, ...props },
    ref
  ) => {
    return (
      <ChartContext.Provider value={{ config, data, isLoading, isDisabled }}>
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
    const Comp = asChild ? Slot : 'div'
    return (
      <Comp ref={ref} className={cn('relative w-full', className)} {...props}>
        {children}
      </Comp>
    )
  }
)
ChartCard.displayName = 'ChartCard'

/* Exports */
export { Chart, ChartCard }
