'use client'

import * as React from 'react'
import { Provider as JotaiProvider } from 'jotai'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

import { TooltipProvider_Shadcn_ } from 'ui'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <JotaiProvider>
      <NextThemesProvider {...props}>
        <TooltipProvider_Shadcn_ delayDuration={0}>{children}</TooltipProvider_Shadcn_>
      </NextThemesProvider>
    </JotaiProvider>
  )
}
