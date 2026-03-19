'use client'

import { Provider as JotaiProvider } from 'jotai'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'
import { TooltipProvider } from 'ui'

import { MobileSidebarProvider } from '@/context/mobile-sidebar-context'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <JotaiProvider>
      <NextThemesProvider {...props}>
        <TooltipProvider delayDuration={0}>
          <MobileSidebarProvider>{children}</MobileSidebarProvider>
        </TooltipProvider>
      </NextThemesProvider>
    </JotaiProvider>
  )
}
