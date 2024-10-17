import { noop } from 'lodash'
import { PropsWithChildren, createContext, useContext, useEffect, useState } from 'react'

import { LOCAL_STORAGE_KEYS } from 'lib/constants'

const AUTH_SMTP_CHANGES_WARNING_KEY = LOCAL_STORAGE_KEYS.AUTH_SMTP_CHANGES_WARNING

// [Joshen] This file is meant to be dynamic - update this as and when we need to use the NoticeBanner

type AppBannerContextType = {
  authSmtpBannerAcknowledged: string[]
  onUpdateAcknowledged: (key: 'auth-smtp', value: boolean | string) => void
}

const AppBannerContext = createContext<AppBannerContextType>({
  authSmtpBannerAcknowledged: [],
  onUpdateAcknowledged: noop,
})

export const useAppBannerContext = () => useContext(AppBannerContext)

export const AppBannerContextProvider = ({ children }: PropsWithChildren<{}>) => {
  // [Joshen] If project specific, can take a list of refs instead - comma separated strings, no spaces
  // Otherwise just a boolean will be fine
  const [authSmtpBannerAcknowledged, setAuthSmtpBannerAcknowledged] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const acknowledgedProjectRefs =
        localStorage.getItem(AUTH_SMTP_CHANGES_WARNING_KEY)?.split(',') ?? []
      setAuthSmtpBannerAcknowledged(acknowledgedProjectRefs)
    }
  }, [])

  const value = {
    authSmtpBannerAcknowledged,
    onUpdateAcknowledged: (key: 'auth-smtp', value: boolean | string) => {
      if (key === 'auth-smtp' && typeof value === 'string' && value.length > 0) {
        const updatedRefs = authSmtpBannerAcknowledged.concat([value])
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(AUTH_SMTP_CHANGES_WARNING_KEY, updatedRefs.join(','))
        }
        setAuthSmtpBannerAcknowledged(updatedRefs)
      }
    },
  }

  return <AppBannerContext.Provider value={value}>{children}</AppBannerContext.Provider>
}

export const useIsNoticeBannerShown = () => {
  const { authSmtpBannerAcknowledged } = useAppBannerContext()
  return authSmtpBannerAcknowledged
}
