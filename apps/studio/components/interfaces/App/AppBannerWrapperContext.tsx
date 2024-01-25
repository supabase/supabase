import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'

const NOTICE_BANNER_KEY = LOCAL_STORAGE_KEYS.PGBOUNCER_DEPRECATION_WARNING

// [Joshen] Update this as and when we need to use the NoticeBanner

type AppBannerContextType = {
  acknowledged: boolean
  onUpdateAcknowledged: (value: boolean) => void
}

const AppBannerContext = createContext<AppBannerContextType>({
  acknowledged: false,
  onUpdateAcknowledged: noop,
})

export const useAppBannerContext = () => useContext(AppBannerContext)

export const AppBannerContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [acknowledged, setAcknowledged] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAcknowledged(localStorage.getItem(NOTICE_BANNER_KEY) === 'true')
    }
  }, [])

  const value = {
    acknowledged,
    onUpdateAcknowledged: (value: boolean) => {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(NOTICE_BANNER_KEY, value.toString())
      }
      setAcknowledged(value)
    },
  }

  return <AppBannerContext.Provider value={value}>{children}</AppBannerContext.Provider>
}

export const useIsNoticeBannerShown = () => {
  const { acknowledged } = useAppBannerContext()
  return acknowledged
}
