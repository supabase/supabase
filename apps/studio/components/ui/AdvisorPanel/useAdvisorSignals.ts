import { useCallback, useEffect, useMemo } from 'react'

import type { AdvisorSignalItem } from './AdvisorPanel.types'
import { useBannedIPsQuery } from '@/data/banned-ips/banned-ips-query'
import type { IPData } from '@/data/banned-ips/banned-ips-query'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const createDismissalStorageKey = (projectRef: string) => `advisor-signal-dismissals:${projectRef}`

const createBannedIPDismissalKey = (ip: string) => `signal:banned-ip:${ip}:v1`

const createBannedIPSignalItems = ({
  projectRef,
  bannedIPsData,
}: {
  projectRef?: string
  bannedIPsData?: IPData
}): AdvisorSignalItem[] => {
  if (!projectRef) return []

  const bannedIPs = bannedIPsData?.banned_ipv4_addresses ?? []

  return bannedIPs.map((ip) => ({
    id: createBannedIPDismissalKey(ip),
    dismissalKey: createBannedIPDismissalKey(ip),
    source: 'signal' as const,
    type: 'banned-ip' as const,
    severity: 'warning' as const,
    tab: 'security' as const,
    title: 'Banned IP address',
    summary: `The IP address \`${ip}\` is temporarily blocked because of suspicious traffic or repeated failed password attempts.`,
    description:
      'This IP address is temporarily blocked because of suspicious traffic or repeated failed password attempts. If this block is expected, you can dismiss this signal or remove the ban.',
    docsUrl: 'https://supabase.com/docs/reference/cli/supabase-network-bans',
    actions: [
      {
        label: 'Edit network bans',
        href: `/project/${projectRef}/database/settings#banned-ips`,
      },
    ],
    sourceData: { type: 'banned-ip' as const, ip },
  }))
}

interface UseAdvisorSignalsOptions {
  projectRef?: string
  enabled?: boolean
}

export const useAdvisorSignals = ({ projectRef, enabled = true }: UseAdvisorSignalsOptions) => {
  const { data, isPending, isError } = useBannedIPsQuery({ projectRef }, { enabled })

  const storageKey = projectRef
    ? createDismissalStorageKey(projectRef)
    : 'advisor-signal-dismissals:unknown-project'

  const [dismissedKeys, setDismissedKeys] = useLocalStorageQuery<string[]>(storageKey, [])

  const dismissedKeySet = useMemo(() => new Set(dismissedKeys), [dismissedKeys])

  const dismissSignal = useCallback(
    (dismissalKey: string) => {
      setDismissedKeys((current) =>
        current.includes(dismissalKey) ? current : [...current, dismissalKey]
      )
    },
    [setDismissedKeys]
  )

  const signalItems = useMemo(
    () => createBannedIPSignalItems({ projectRef, bannedIPsData: data }),
    [projectRef, data]
  )

  // Prune stale dismissals when the active signal list changes (e.g. an IP was unbanned)
  useEffect(() => {
    if (!data) return

    const activeKeys = new Set(signalItems.map((item) => item.dismissalKey))

    setDismissedKeys((current) => {
      const next = current.filter((key) =>
        key.startsWith('signal:banned-ip:') ? activeKeys.has(key) : true
      )
      return next.length === current.length ? current : next
    })
  }, [data, signalItems, setDismissedKeys])

  const formattedData = useMemo(
    () => signalItems.filter((item) => !dismissedKeySet.has(item.dismissalKey)),
    [signalItems, dismissedKeySet]
  )

  return {
    data: formattedData,
    dismissSignal,
    isPending,
    isError,
  }
}
