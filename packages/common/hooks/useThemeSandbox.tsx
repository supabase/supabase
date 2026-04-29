'use client'

import { useEffect, useState } from 'react'

import { IS_PROD } from '../constants'

const defaultDark: { [name: string]: string } = {
  '--brand-accent': '160deg 100% 50%',
  '--brand-default': '159.9deg 100% 38.6%',
  '--brand-600': '136deg 59.5% 70%',
  '--brand-500': '160.4deg 100% 19.2%',
  '--brand-400': '160.4deg 100% 9.6%',
  '--brand-300': '158.4deg 100% 4.9%',
  '--brand-200': '162deg 100% 2%',
  '--border-stronger': '200deg 16.1% 22%',
  '--border-strong': '200deg 16.5% 17.8%',
  '--border-alternative': '200deg 16.4% 13.1%',
  '--border-control': '200deg 10% 14%',
  '--border-overlay': '200deg 20% 9%',
  '--border-secondary': '200deg 21.6% 10%',
  '--border-muted': '200deg 14.9% 9.2%',
  '--border-default': '200deg 10% 11%',
  '--background-muted': '200deg 9.1% 10.8%',
  '--background-overlay-hover': '200deg 20% 11%',
  '--background-overlay-default': '200deg 14.3% 6.9%',
  '--background-surface-300': '200deg 20% 10%',
  '--background-surface-200': '200deg 20% 7%',
  '--background-surface-100': '200deg 20% 6%',
  '--background-control': '200deg 9% 11%',
  '--background-selection': '200deg 9.8% 10%',
  '--background-alternative': '200deg 20% 2.9%',
  '--background-default': '200deg 20% 4%',
  '--foreground-muted': '200deg 10% 35%',
  '--foreground-lighter': '200deg 8% 55%',
  '--foreground-light': '200deg 5% 69%',
  '--foreground-default': '200deg 0% 93%',
}

/**
 * Shows a GUI to test color themes in dev and preview env.
 *
 * To access sandbox mode:
 * - switch theme to dark mode
 * - append "#theme-sandbox" to the url
 * - select "Apply Theme" to apply preset (localStorage will keep track of changes so you don't lose new values)
 * - select "Reset localStorage" and refresh page to restart
 *
 * Hooks are called unconditionally so the server and client agree on hook
 * count — guarding the work inside `useEffect` keeps SSR clean and avoids
 * BAILOUT_TO_CLIENT_SIDE_RENDERING on preview deploys (FE-3079).
 */
export const useThemeSandbox = (): null => {
  const [, setThemeConfig] = useState<{ [name: string]: string }>(defaultDark)

  useEffect(() => {
    if (IS_PROD || typeof window === 'undefined') return

    const hash = window.location.hash
    const localPreset = localStorage.getItem('theme-sandbox')
    const isSandbox = hash.includes('#theme-sandbox') || localPreset !== null

    let currentConfig: { [name: string]: string } = defaultDark
    if (localPreset) {
      try {
        currentConfig = JSON.parse(localPreset)
        setThemeConfig(currentConfig)
      } catch {
        // ignore malformed preset
      }
    }

    if (!isSandbox) return

    const styles = document.querySelector(':root') as HTMLElement | null

    const updateCSSVariables = () => {
      Object.entries(currentConfig).forEach(([key, value]) => {
        styles?.style.setProperty(key, value)
      })
      localStorage.setItem('theme-sandbox', JSON.stringify(currentConfig))
    }

    const handleSetThemeConfig = (name: string, value: string) => {
      currentConfig = { ...currentConfig, [name]: value }
      updateCSSVariables()
      setThemeConfig(currentConfig)
    }

    let gui: any
    let cancelled = false

    ;(async () => {
      const dat = await import('dat.gui')
      if (cancelled) return

      gui = new dat.GUI()
      gui.width = 500

      Object.entries(defaultDark).forEach(([key]) => {
        if (!currentConfig[key]) {
          localStorage.removeItem('theme-sandbox')
          return
        }
        const folderName = key.split('-')[2]
        const folder = gui.__folders[folderName] ?? gui.addFolder(folderName)

        folder
          .add(currentConfig, key)
          .name(key)
          .onChange((newValue: string) => {
            handleSetThemeConfig(key, newValue)
          })
      })

      const obj = {
        'Apply Theme': () => updateCSSVariables(),
        'Exit Sandbox': () => gui?.destroy(),
        'Reset localStorage': () => {
          localStorage.removeItem('theme-sandbox')
          currentConfig = defaultDark
          setThemeConfig(defaultDark)
        },
      }

      gui.add(obj, 'Apply Theme')
      gui.add(obj, 'Reset localStorage')
      gui.add(obj, 'Exit Sandbox')
    })()

    return () => {
      cancelled = true
      gui?.destroy()
    }
  }, [])

  return null
}

export default useThemeSandbox
