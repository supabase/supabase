'use client'

import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider
      themes={['dark', 'light', 'classic-dark']}
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}

export { Providers }
