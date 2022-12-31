import { useMonaco } from '@monaco-editor/react'
import { autorun } from 'mobx'
import { createContext, FC, useContext, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

import { IRootStore } from 'stores'
import { getTheme } from 'components/ui/CodeEditor'
import SparkBar from 'components/ui/SparkBar'

const StoreContext = createContext<IRootStore>(undefined!)

export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within StoreProvider')
  }

  return context
}

interface StoreProvider {
  rootStore: IRootStore
}
export const StoreProvider: FC<StoreProvider> = ({ children, rootStore }) => {
  const monaco = useMonaco()
  const { ui } = rootStore
  const { theme } = ui

  useEffect(() => {
    if (monaco) {
      const theme: any = getTheme(ui.isDarkTheme)
      monaco.editor.defineTheme('supabase', theme)
    }
  }, [theme, monaco])

  const matchMediaEvent = useCallback(() => {
    ui.themeOption === 'system' &&
      ui.setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  }, [])

  useEffect(() => {
    ui.load()

    if (window?.matchMedia('(prefers-color-scheme: dark)')?.addEventListener) {
      // backwards compatibility for safari < v14
      // limited support for addEventListener()
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', matchMediaEvent)
    }

    autorun(() => {
      if (ui.notification) {
        const { id, category, error, message, description, progress, duration } = ui.notification
        const toastDuration = duration || 4000
        switch (category) {
          case 'info':
            return toast(message, { id, duration: toastDuration })
          case 'success':
            return toast.success(message, { id, duration: toastDuration })
          case 'error':
            console.error('Error:', { error, message })
            return toast.error(message, { id, duration: duration || Infinity })
          case 'loading':
            if (progress !== undefined) {
              return toast.loading(
                <div className="flex flex-col space-y-2" style={{ minWidth: '220px' }}>
                  <SparkBar
                    value={progress}
                    max={100}
                    type="horizontal"
                    barClass="bg-brand-900"
                    labelBottom={message}
                    labelTop={`${progress.toFixed(2)}%`}
                  />
                  {description !== undefined && (
                    <p className="text-xs text-scale-1100">{description}</p>
                  )}
                </div>,
                { id }
              )
            } else {
              return toast.loading(message, { id })
            }
        }
      }
    })
    return () =>
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .removeEventListener('change', matchMediaEvent)
  }, [])

  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
}
