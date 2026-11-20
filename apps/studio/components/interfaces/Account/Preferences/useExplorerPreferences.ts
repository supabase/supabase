import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'common'
import { z } from 'zod'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useProfile } from '@/lib/profile'

export const explorerHomeSchema = z.enum(['home', 'query'])
export type ExplorerHome = z.infer<typeof explorerHomeSchema>

const preferencesSchema = z.object({
  home: explorerHomeSchema.catch('home'),
  hasCompletedOnboarding: z.boolean().catch(false),
})
const accountsSchema = z.record(z.unknown())
const defaultPreferences = preferencesSchema.parse({})

export const useExplorerPreferences = () => {
  const { profile } = useProfile()
  const accountId = IS_PLATFORM && profile ? profile.id.toString() : 'self-hosted'
  const [stored, setStored, { isSuccess, isError }] = useLocalStorageQuery<unknown>(
    LOCAL_STORAGE_KEYS.EXPLORER_PREFERENCES,
    {}
  )
  const accounts = accountsSchema.safeParse(stored).data ?? {}
  const preferences = preferencesSchema.safeParse(accounts[accountId]).data ?? defaultPreferences
  const isReady = (!IS_PLATFORM || !!profile) && (isSuccess || isError)

  const updatePreferences = (updates: Partial<z.infer<typeof preferencesSchema>>) => {
    if (!isReady) return
    setStored((current: unknown) => {
      const accounts = accountsSchema.safeParse(current).data ?? {}
      const previous = preferencesSchema.safeParse(accounts[accountId]).data ?? defaultPreferences
      return { ...accounts, [accountId]: { ...previous, ...updates } }
    })
  }

  return {
    ...preferences,
    isReady,
    setHome: (home: ExplorerHome) => updatePreferences({ home }),
    completeOnboarding: () => updatePreferences({ hasCompletedOnboarding: true }),
  }
}
