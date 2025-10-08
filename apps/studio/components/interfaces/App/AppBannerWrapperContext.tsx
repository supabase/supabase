import { LOCAL_STORAGE_KEYS } from 'common'
import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

const MIDDLEWARE_OUTAGE_BANNER_KEY = LOCAL_STORAGE_KEYS.MIDDLEWARE_OUTAGE_BANNER

// [Joshen] This file is meant to be dynamic - update this as and when we need to use the NoticeBanner

type AppBannerContextType = {
  middlewareOutageBannerAcknowledged: boolean
  onUpdateAcknowledged: (key: typeof MIDDLEWARE_OUTAGE_BANNER_KEY) => void
}

const AppBannerContext = createContext<AppBannerContextType>({
  middlewareOutageBannerAcknowledged: false,
  onUpdateAcknowledged: noop,
})

export const useAppBannerContext = () => useContext(AppBannerContext)

export const AppBannerContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [middlewareOutageBannerAcknowledged, setmiddlewareOutageBannerAcknowledged] =
    useState<boolean>(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const acknowledged = localStorage.getItem(MIDDLEWARE_OUTAGE_BANNER_KEY) === 'true'
      setmiddlewareOutageBannerAcknowledged(acknowledged)
    }
  }, [])

  const value = {
    middlewareOutageBannerAcknowledged,
    onUpdateAcknowledged: (key: typeof MIDDLEWARE_OUTAGE_BANNER_KEY) => {
      if (key === MIDDLEWARE_OUTAGE_BANNER_KEY) {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(MIDDLEWARE_OUTAGE_BANNER_KEY, 'true')
        }
        setmiddlewareOutageBannerAcknowledged(true)
      }
    },
  }

  return <AppBannerContext.Provider value={value}>{children}</AppBannerContext.Provider>
}

export const useIsNoticeBannerShown = () => {
  const { middlewareOutageBannerAcknowledged } = useAppBannerContext()
  return middlewareOutageBannerAcknowledged
}
