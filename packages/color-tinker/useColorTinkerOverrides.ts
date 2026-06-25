'use client'

import { useTheme } from 'next-themes'
import { useCallback, useEffect, useState } from 'react'

import type { ColorVarName, ColorValues } from './types'
import {
  applyColorVarOverrides,
  clearColorVarOverrides,
  getThemeKey,
  readComputedVars,
  readStoredValues,
  writeStoredValues,
} from './utils'
import { COLOR_INPUTS } from './constants'

// Duplicated for tree-shaking — bundler must see literal process.env reference.
// Keep in sync: index.ts, ColorTinkerContext.tsx, ColorTinkerTrigger.tsx, ColorSystemTinker.tsx
const env = process.env.NEXT_PUBLIC_ENVIRONMENT
const IS_COLOR_TINKER_ENABLED = env === 'local' || env === 'staging'

export function useColorTinkerOverrides(isEnabled: boolean) {
  const { resolvedTheme } = useTheme()
  const themeKey = getThemeKey(resolvedTheme)
  const [values, setValues] = useState<ColorValues>(() => readComputedVars())
  const [hasOverrides, setHasOverrides] = useState(false)

  useEffect(() => {
    if (!IS_COLOR_TINKER_ENABLED || !isEnabled || !resolvedTheme) {
      clearColorVarOverrides()
      return
    }

    let cancelled = false

    const syncThemeValues = () => {
      if (cancelled) return

      clearColorVarOverrides()

      const stored = readStoredValues(themeKey)
      const themeValues = stored[themeKey]

      if (themeValues) {
        applyColorVarOverrides(themeValues)
        setValues(themeValues)
        setHasOverrides(true)
        return
      }

      setValues(readComputedVars())
      setHasOverrides(false)
    }

    // Wait for next-themes to apply the active theme before reading defaults.
    requestAnimationFrame(() => {
      requestAnimationFrame(syncThemeValues)
    })

    return () => {
      cancelled = true
      clearColorVarOverrides()
    }
  }, [isEnabled, resolvedTheme, themeKey])

  const updateVar = useCallback(
    (name: ColorVarName, rawValue: number) => {
      const config = COLOR_INPUTS.find((input) => input.name === name)
      if (!config) return

      const value = Math.min(config.max, Math.max(config.min, rawValue))

      setValues((prev) => {
        const next = { ...prev, [name]: value }
        applyColorVarOverrides(next)

        const stored = readStoredValues(themeKey)
        writeStoredValues({ ...stored, [themeKey]: next })
        setHasOverrides(true)
        return next
      })
    },
    [themeKey]
  )

  const reset = useCallback(() => {
    const stored = readStoredValues(themeKey)
    delete stored[themeKey]
    writeStoredValues(stored)

    clearColorVarOverrides()
    setValues(readComputedVars())
    setHasOverrides(false)
  }, [themeKey])

  return { values, hasOverrides, updateVar, reset }
}
