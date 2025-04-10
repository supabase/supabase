import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'

const FLY_POSTGRES_DEPRECATION_WARNING_KEY = LOCAL_STORAGE_KEYS.FLY_POSTGRES_DEPRECATION_WARNING

// [Joshen] This file is meant to be dynamic - update this as and when we need to use the NoticeBanner

type AppBannerContextType = {
  flyPostgresBannerAcknowledged: boolean
  onUpdateAcknowledged: (key: 'fly-postgres') => void
}

const AppBannerContext = createContext<AppBannerContextType>({
  flyPostgresBannerAcknowledged: false,
  onUpdateAcknowledged: noop,
})

export const useAppBannerContext = () => useContext(AppBannerContext)

export const AppBannerContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [flyPostgresBannerAcknowledged, setFlyPostgresBannerAcknowledged] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const acknowledged = localStorage.getItem(FLY_POSTGRES_DEPRECATION_WARNING_KEY) === 'true'
      setFlyPostgresBannerAcknowledged(acknowledged)
    }
  }, [])

  const value = {
    flyPostgresBannerAcknowledged,
    onUpdateAcknowledged: (key: 'fly-postgres') => {
      if (key === 'fly-postgres') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(FLY_POSTGRES_DEPRECATION_WARNING_KEY, 'true')
        }
        setFlyPostgresBannerAcknowledged(true)
      }
    },
  }

  return <AppBannerContext.Provider value={value}>{children}</AppBannerContext.Provider>
}

export const useIsNoticeBannerShown = () => {
  const { flyPostgresBannerAcknowledged } = useAppBannerContext()
  return flyPostgresBannerAcknowledged
}
