import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'

const PGBOUNCER_BANNER_KEY = LOCAL_STORAGE_KEYS.PGBOUNCER_IPV6_DEPRECATION_WARNING
const VERCEL_BANNER_KEY = LOCAL_STORAGE_KEYS.VERCEL_IPV6_DEPRECATION_WARNING
const DEFAULT_NOTICE_BANNER_KEY = LOCAL_STORAGE_KEYS.PGBOUNCER_DEPRECATION_WARNING

// [Joshen] Update this as and when we need to use the NoticeBanner

type AppBannerContextType = {
  ipv6BannerAcknowledged: boolean
  pgbouncerBannerAcknowledged: string[]
  vercelBannerAcknowledged: string[]
  onUpdateAcknowledged: (key: 'ipv6' | 'pgbouncer' | 'vercel', value: boolean | string) => void
}

const AppBannerContext = createContext<AppBannerContextType>({
  ipv6BannerAcknowledged: false,
  pgbouncerBannerAcknowledged: [],
  vercelBannerAcknowledged: [],
  onUpdateAcknowledged: noop,
})

export const useAppBannerContext = () => useContext(AppBannerContext)

export const AppBannerContextProvider = ({ children }: PropsWithChildren<{}>) => {
  const [ipv6BannerAcknowledged, setIpv6BannerAcknowledged] = useState(false)

  // [Joshen] These will take a list of refs instead since they are project specific
  // Comma separated strings, no spaces
  const [pgbouncerBannerAcknowledged, setPgbouncerBannerAcknowledged] = useState<string[]>([])
  const [vercelBannerAcknowledged, setVercelBannerAcknowledged] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIpv6BannerAcknowledged(localStorage.getItem(DEFAULT_NOTICE_BANNER_KEY) === 'true')

      const acknowledgedPbBouncerRefs = localStorage.getItem(PGBOUNCER_BANNER_KEY)?.split(',') ?? []
      setPgbouncerBannerAcknowledged(acknowledgedPbBouncerRefs)

      const acknowledgedVercelRefs = localStorage.getItem(VERCEL_BANNER_KEY)?.split(',') ?? []
      setVercelBannerAcknowledged(acknowledgedVercelRefs)
    }
  }, [])

  const value = {
    ipv6BannerAcknowledged,
    pgbouncerBannerAcknowledged,
    vercelBannerAcknowledged,
    onUpdateAcknowledged: (key: 'ipv6' | 'pgbouncer' | 'vercel', value: boolean | string) => {
      if (key === 'ipv6' && typeof value === 'boolean') {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(DEFAULT_NOTICE_BANNER_KEY, value.toString())
        }
        setIpv6BannerAcknowledged(value)
      }

      if (key === 'pgbouncer' && typeof value === 'string' && value.length > 0) {
        const updatedRefs = pgbouncerBannerAcknowledged.concat([value])
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(PGBOUNCER_BANNER_KEY, updatedRefs.join(','))
        }
        setPgbouncerBannerAcknowledged(updatedRefs)
      }

      if (key === 'vercel' && typeof value === 'string' && value.length > 0) {
        const updatedRefs = pgbouncerBannerAcknowledged.concat([value])
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(VERCEL_BANNER_KEY, updatedRefs.join(','))
        }
        setVercelBannerAcknowledged(updatedRefs)
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
