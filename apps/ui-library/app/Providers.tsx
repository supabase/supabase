'use client'

import { Provider as JotaiProvider } from 'jotai'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

import { TooltipProvider } from 'ui'
import { FrameworkProvider } from '@/context/framework-context'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <JotaiProvider>
      <NextThemesProvider {...props}>
        <FrameworkProvider>
          <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
        </FrameworkProvider>
      </NextThemesProvider>
    </JotaiProvider>
  )
}
