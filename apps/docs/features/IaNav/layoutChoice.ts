'use client'

import { LOCAL_STORAGE_KEYS } from 'common/constants/local-storage'
import { safeLocalStorage, safeSessionStorage } from 'common/safe-storage'
import { useSyncExternalStore } from 'react'

import { IA_NAV_OVERRIDE_KEY, isIaNavVariant, type IaNavVariant } from './constants'

const listeners = new Set<() => void>()

export const subscribeToLayoutChoice = (listener: () => void) => {
  listeners.add(listener)
  // a change in another tab must switch this tab too
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

export const useLayoutChoice = (): IaNavVariant | null =>
  useSyncExternalStore(
    subscribeToLayoutChoice,
    () => {
      const stored = safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.DOCS_LAYOUT_CHOICE)
      return isIaNavVariant(stored) ? stored : null
    },
    () => null
  )

export const setLayoutChoice = (variant: IaNavVariant): void => {
  // the session override wins over the choice, so a forced link must not keep the old layout
  safeSessionStorage.removeItem(IA_NAV_OVERRIDE_KEY)
  safeLocalStorage.setItem(LOCAL_STORAGE_KEYS.DOCS_LAYOUT_CHOICE, variant)
  listeners.forEach((listener) => listener())
}
