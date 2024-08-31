import { TooltipProvider as RadixTooltipProvider } from '@radix-ui/react-tooltip'
import { ReactNode } from 'react'

export function TooltipProvider({ children }: { children: ReactNode }) {
  return <RadixTooltipProvider>{children}</RadixTooltipProvider>
}
