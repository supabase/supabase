import { createContext, useCallback, useContext, useState } from 'react'

export const BANNER_ID = {
  DATABASE_CONNECTIONS: 'database-connections-banner',
  INDEX_ADVISOR: 'index-advisor-banner',
  TABLE_EDITOR_QUEUE_OPERATIONS: 'table-editor-queue-operations-banner',
  RLS_EVENT_TRIGGER: 'rls-event-trigger-banner',
  FREE_MICRO_UPGRADE: 'free-micro-upgrade-banner',
  TOS_UPDATE: 'tos-update-banner',
  LOGS_ALL_DEPRECATION: 'logs-all-deprecation-banner',
  SELECT_26: 'select-2026-banner',
} as const

export type BannerId = (typeof BANNER_ID)[keyof typeof BANNER_ID]

export interface Banner {
  id: BannerId
  content: React.ReactNode
  isDismissed: boolean
  priority?: number
  onDismiss?: () => void
}

interface BannerStackContextType {
  banners: Banner[]
  addBanner: (banner: Banner) => void
  dismissBanner: (id: BannerId) => void
}

const BannerStackContext = createContext<BannerStackContextType | undefined>(undefined)

export const BannerStackProvider = ({ children }: { children: React.ReactNode }) => {
  const [banners, setBanners] = useState<Banner[]>([])

  const addBanner = useCallback((banner: Banner) => {
    setBanners((prev) => {
      const existingIndex = prev.findIndex((b) => b.id === banner.id)
      if (existingIndex !== -1) {
        if (!prev[existingIndex].isDismissed) return prev
        const revived = [...prev]
        revived[existingIndex] = banner
        return revived.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
      }
      const newBanners = [...prev, banner]
      return newBanners.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
    })
  }, [])

  const dismissBanner = useCallback((id: string) => {
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, isDismissed: true } : b)))
    setTimeout(() => {
      // A later addBanner can revive this id before the exit animation
      // finishes. Drop it only if it is still dismissed.
      setBanners((prev) => prev.filter((b) => b.id !== id || !b.isDismissed))
    }, 300)
  }, [])

  return (
    <BannerStackContext.Provider value={{ banners, addBanner, dismissBanner }}>
      {children}
    </BannerStackContext.Provider>
  )
}

export const useBannerStack = () => {
  const context = useContext(BannerStackContext)
  if (!context) throw new Error('useBannerStack must be used within BannerStackProvider')
  return context
}
