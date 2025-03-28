'use client'

import { AuthProvider } from 'common'
import { Provider as JotaiProvider } from 'jotai'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ThemeProviderProps } from 'next-themes/dist/types'

import { FrameworkProvider } from '@/context/framework-context'
import { TooltipProvider } from 'ui'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <AuthProvider>
      <JotaiProvider>
        <NextThemesProvider {...props}>
          <FrameworkProvider>
            <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
          </FrameworkProvider>
        </NextThemesProvider>
      </JotaiProvider>
    </AuthProvider>
  )
}
