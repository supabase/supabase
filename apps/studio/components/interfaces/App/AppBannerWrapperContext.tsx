import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'

const PGBOUNCER_BANNER_KEY = LOCAL_STORAGE_KEYS.PGBOUNCER_IPV6_DEPRECATION_WARNING
const VERCEL_BANNER_KEY = LOCAL_STORAGE_KEYS.VERCEL_IPV6_DEPRECATION_WARNING
const DEFAULT_NOTICE_BANNER_KEY = LOCAL_STORAGE_KEYS.PGBOUNCER_DEPRECATION_WARNING

// [Joshen] Update this as and when we need to use the NoticeBanner

type AppBannerContextType = {
  ipv6BannerAcknowledged: boolean
  pgbouncerBannerAcknowledged: boolean
  vercelBannerAcknowledged: boolean
  onUpdateAcknowledged: (key: 'ipv6' | 'pgbouncer' | 'vercel', value: boolean) => void
}

const AppBannerContext = createContext<AppBannerContextType>({
  ipv6BannerAcknowledged: false,
  pgbouncerBannerAcknowledged: false,
  vercelBannerAcknowledged: false,
  onUpdateAcknowledged: noop,
})

export const useAppBannerContext = () => useContext(AppBannerContext)

export const AppBannerContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [ipv6BannerAcknowledged, setIpv6BannerAcknowledged] = useState(false)
  const [pgbouncerBannerAcknowledged, setPgbouncerBannerAcknowledged] = useState(false)
  const [vercelBannerAcknowledged, setVercelBannerAcknowledged] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIpv6BannerAcknowledged(localStorage.getItem(DEFAULT_NOTICE_BANNER_KEY) === 'true')
      setPgbouncerBannerAcknowledged(localStorage.getItem(PGBOUNCER_BANNER_KEY) === 'true')
      setVercelBannerAcknowledged(localStorage.getItem(VERCEL_BANNER_KEY) === 'true')
    }
  }, [])

  const value = {
    ipv6BannerAcknowledged,
    pgbouncerBannerAcknowledged,
    vercelBannerAcknowledged,
    onUpdateAcknowledged: (key: 'ipv6' | 'pgbouncer' | 'vercel', value: boolean) => {
      console.log('onUpdateAcknowledged', key)
      if (key === 'ipv6') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(DEFAULT_NOTICE_BANNER_KEY, value.toString())
        }
        setIpv6BannerAcknowledged(value)
      }

      if (key === 'pgbouncer') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(PGBOUNCER_BANNER_KEY, value.toString())
        }
        setPgbouncerBannerAcknowledged(value)
      }

      if (key === 'vercel') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(VERCEL_BANNER_KEY, value.toString())
        }
        setVercelBannerAcknowledged(value)
      }
    },
  }

  return <AppBannerContext.Provider value={value}>{children}</AppBannerContext.Provider>
}

export const useIsNoticeBannerShown = () => {
  const { ipv6BannerAcknowledged, pgbouncerBannerAcknowledged, vercelBannerAcknowledged } =
    useAppBannerContext()
  return ipv6BannerAcknowledged && pgbouncerBannerAcknowledged && vercelBannerAcknowledged
}
