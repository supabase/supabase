'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

import { ENABLED_STORAGE_KEY } from './constants'
import type { ColorTinkerContextType } from './types'
import { clearColorVarOverrides } from './utils'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: index.ts, ColorTinkerTrigger.tsx, ColorSystemTinker.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_COLOR_TINKER_ENABLED = env === 'local' || env === 'staging'

declare global {
  interface Window {
    devColors?: () => void
  }
}

const ColorTinkerContext = createContext<ColorTinkerContextType | null>(null)

export function ColorTinkerProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false)

  const dismissColorTinker = useCallback(() => {
    try {
      localStorage.removeItem(ENABLED_STORAGE_KEY)
    } catch {}
    clearColorVarOverrides()
    setIsEnabled(false)
  }, [])

  useEffect(() => {
    if (!IS_COLOR_TINKER_ENABLED) return

    let stored: string | null = null
    try {
      stored = localStorage.getItem(ENABLED_STORAGE_KEY)
    } catch {}
    if (stored === 'true') {
      setIsEnabled(true)
    }

    window.devColors = () => {
      try {
        localStorage.setItem(ENABLED_STORAGE_KEY, 'true')
      } catch {}
      setIsEnabled(true)
    }

    return () => {
      delete window.devColors
    }
  }, [])

  if (!IS_COLOR_TINKER_ENABLED) {
    return <>{children}</>
  }

  return (
    <ColorTinkerContext.Provider value={{ isEnabled, dismissColorTinker }}>
      {children}
    </ColorTinkerContext.Provider>
  )
}

export function useColorTinker() {
  const context = useContext(ColorTinkerContext)
  if (!context) {
    return {
      isEnabled: false,
      dismissColorTinker: () => {},
    }
  }
  return context
}
