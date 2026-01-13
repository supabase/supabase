import { LOCAL_STORAGE_KEYS } from 'common'
import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

const MAINTENANCE_WINDOW_BANNER_KEY = LOCAL_STORAGE_KEYS.MAINTENANCE_WINDOW_BANNER

// [Joshen] This file is meant to be dynamic - update this as and when we need to use the NoticeBanner

type AppBannerContextType = {
  maintenanceWindowBannerAcknowledged: boolean
  onUpdateAcknowledged: (key: typeof MAINTENANCE_WINDOW_BANNER_KEY) => void
}

const AppBannerContext = createContext<AppBannerContextType>({
  maintenanceWindowBannerAcknowledged: false,
  onUpdateAcknowledged: noop,
})

export const useAppBannerContext = () => useContext(AppBannerContext)

export const AppBannerContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [maintenanceWindowBannerAcknowledged, setMaintenanceWindowBannerAcknowledged] =
    useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const maintenanceAcknowledged = localStorage.getItem(MAINTENANCE_WINDOW_BANNER_KEY) === 'true'
      setMaintenanceWindowBannerAcknowledged(maintenanceAcknowledged)
    }
  }, [])

  const value = {
    maintenanceWindowBannerAcknowledged,
    onUpdateAcknowledged: (key: typeof MAINTENANCE_WINDOW_BANNER_KEY) => {
      if (key === MAINTENANCE_WINDOW_BANNER_KEY) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(MAINTENANCE_WINDOW_BANNER_KEY, 'true')
        }
        setMaintenanceWindowBannerAcknowledged(true)
      }
    },
  }

  return <AppBannerContext.Provider value={value}>{children}</AppBannerContext.Provider>
}

export const useIsNoticeBannerShown = () => {
  const { maintenanceWindowBannerAcknowledged } = useAppBannerContext()
  return maintenanceWindowBannerAcknowledged
}
