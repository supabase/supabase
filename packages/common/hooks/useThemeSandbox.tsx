import { useEffect, useState } from 'react'
import { IS_PROD } from '../constants'

let defaultConfig: { [name: string]: string } = {
  // Dark
  '--brand-accent': '160deg 100% 50%',
  '--brand-default': '159.9deg 100% 38.6%',
  '--brand-600': '176deg 59.5% 70%',
  '--brand-500': '160.4deg 100% 19.2%',
  '--brand-400': '160.4deg 100% 9.6%',
  '--brand-300': '158.4deg 100% 4.9%',
  '--brand-200': '162deg 100% 2%',
  '--border-stronger': '210deg 16.1% 22%',
  '--border-strong': '210deg 16.5% 17.8%',
  '--border-alternative': '210deg 16.4% 13.1%',
  '--border-control': '210deg 10% 14%',
  '--border-overlay': '210deg 20% 9%',
  '--border-secondary': '210deg 21.6% 10%',
  '--border-muted': '210deg 14.9% 9.2%',
  '--border-default': '210deg 10% 11%',
  '--background-muted': '210deg 9.1% 10.8%',
  '--background-overlay-hover': '210deg 10.7% 11%',
  '--background-overlay-default': '210deg 14.3% 6.9%',
  '--background-surface-300': '210deg 20% 10%',
  '--background-surface-200': '210deg 20% 7%',
  '--background-surface-100': '210deg 20% 6%',
  '--background-control': '210deg 9% 11%%',
  '--background-selection': '210deg 9.8% 10%',
  '--background-alternative': '210deg 20% 2.9%',
  '--background-default': '210deg 20% 4%',
  '--foreground-muted': '210deg 10% 35%',
  '--foreground-lighter': '210deg 8% 55%',
  '--foreground-light': '210deg 5% 69%',
  '--foreground-default': '210deg 0% 93%',
  // Light
  // "--brand-accent": "152.9deg 60% 52.9%",
  // "--brand-default": "152.9deg 60% 52.9%",
  // "--brand-600": "153.2deg 49.7% 33.5%",
  // "--brand-500": "148.7deg 42.7% 69.2%",
  // "--brand-400": "149.1deg 59.3% 88.4%",
  // "--brand-300": "148.6deg 77.8% 94.7%",
  // "--brand-200": "156deg 71.4% 98.6%",
  // "--background-muted": "0deg 0% 100%",
  // "--background-alternative": "0deg 0% 100%",
  // "--border-stronger": "var(--colors-gray-light-800)",
  // "--border-strong": "var(--colors-gray-light-700)",
  // "--border-alternative": "var(--colors-slate-light-500)",
  // "--border-control": "var(--colors-slate-light-600)",
  // "--border-overlay": "var(--colors-slate-light-500)",
  // "--border-muted": "var(--colors-gray-dark-400)",
  // "--border-default": "var(--colors-slate-light-500)",
  // "--background-overlay-hover": "var(--colors-slate-light-300)",
  // "--background-overlay-default": "var(--colors-slate-light-100)",
  // "--background-surface-300": "var(--colors-slate-light-400)",
  // "--background-surface-200": "var(--colors-slate-light-300)",
  // "--background-surface-100": "var(--colors-slate-light-100)",
  // "--background-control": "var(--colors-slate-light-300)",
  // "--background-selection": "var(--colors-gray-light-400)",
  // "--background-default": "var(--colors-slate-light-200)",
  // "--foreground-muted": "var(--colors-slate-light-800)",
  // "--foreground-lighter": "var(--colors-slate-light-1000)",
  // "--foreground-light": "var(--colors-slate-light-1100)",
  // "--foreground-default": "var(--colors-slate-light-1200)",
}

/**
 * Shows a GUI to test color themes in dev and preview env.
 *
 * To access sandbox mode:
 * - switch theme to dark mode
 * - append "#theme-sandbox" to the url
 * - select "Apply Theme" to apply preset (localStorage will keep track of changes so you don't lose new values)
 * - select "Reset localStorage" and refresh page to restart
 */
export const useThemeSandbox = (): any => {
  const isWindowUndefined = typeof window === 'undefined'
  if (isWindowUndefined || IS_PROD) return null
  const hash = window.location.hash
  const localPreset = localStorage.getItem('theme-sandbox')
  const isSandbox = hash.includes('#theme-sandbox') || localPreset !== null
  const [themeConfig, setThemeConfig] = useState(
    localPreset ? JSON.parse(localPreset) : defaultConfig
  )
  const styles = document.querySelector(':root') as any

  const handleSetThemeConfig = (name: string, value: any) => {
    updateCSSVariables()
    setThemeConfig((prevConfig: any) => ({ ...prevConfig, [name]: value }))
  }

  const updateCSSVariables = () => {
    Object.entries(themeConfig).map(([key, value]) => styles.style.setProperty(key, value))
    localStorage.setItem('theme-sandbox', JSON.stringify(themeConfig))
  }

  const init = async () => {
    if (!isSandbox) return
    const dat = await import('dat.gui')
    const gui = new dat.GUI()

    gui.width = 500

    Object.entries(defaultConfig).map(([key, _value]) => {
      const folderName = key.split('-')[2]
      const folder = gui.__folders[folderName] ?? gui.addFolder(folderName)

      return folder
        .add(themeConfig, key)
        .name(key)
        .onChange((newValue) => {
          handleSetThemeConfig(key, newValue)
        })
    })

    var obj = {
      'Apply Theme': function () {
        updateCSSVariables()
      },
      'Exit Sandbox': function () {
        gui.destroy()
      },
      'Reset localStorage': function () {
        localStorage.removeItem('theme-sandbox')
        setThemeConfig(defaultConfig)
      },
    }

    gui.add(obj, 'Apply Theme')
    gui.add(obj, 'Reset localStorage')
    gui.add(obj, 'Exit Sandbox')
    gui.load
  }

  useEffect(() => {
    init()
  }, [])

  return { themeConfig, handleSetThemeConfig, isSandbox }
}

export default useThemeSandbox
