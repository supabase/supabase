import { useMonaco } from '@monaco-editor/react'
import { getTheme } from 'components/ui/CodeEditor'
import { autorun } from 'mobx'
import { createContext, FC, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'
import { IRootStore } from 'stores'

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

  useEffect(() => {
    ui.load()

    autorun(() => {
      if (ui.notification) {
        const { id, category, message } = ui.notification
        switch (category) {
          case 'info':
            return toast(message, { id })
          case 'success':
            return toast.success(message, { id })
          case 'error':
            console.error(message)
            return toast.error(message, { id })
          case 'loading':
            return toast.loading(message, { id })
        }
      }
    })
  }, [])

  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
}
