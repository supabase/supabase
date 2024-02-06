import { autorun } from 'mobx'
import { createContext, PropsWithChildren, useContext, useEffect } from 'react'
import toast from 'react-hot-toast'

import SparkBar from 'components/ui/SparkBar'
import { IUiStore } from 'stores/UiStore'

const StoreContext = createContext<{ ui: IUiStore }>(undefined!)

/**
 * @deprecated use the toast.success/loading/error functions, imported from 'react-hot-toast'
 */
export function useStore() {
  const context = useContext(StoreContext)
  if (context === undefined) {
    throw new Error('useStore must be used within StoreProvider')
  }

  // returning in this way so that it's backwards compatible.
  return context
}

interface StoreProvider {
  rootStore: { ui: IUiStore }
}
export const StoreProvider = ({ children, rootStore }: PropsWithChildren<StoreProvider>) => {
  const { ui } = rootStore
  useEffect(() => {
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
                    barClass="bg-brand"
                    labelBottom={message}
                    labelTop={`${progress.toFixed(2)}%`}
                  />
                  {description !== undefined && (
                    <p className="text-xs text-foreground-light">{description}</p>
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
  }, [])

  return <StoreContext.Provider value={rootStore}>{children}</StoreContext.Provider>
}
