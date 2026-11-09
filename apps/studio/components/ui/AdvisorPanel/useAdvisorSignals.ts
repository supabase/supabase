import { useQueryClient } from '@tanstack/react-query'
import { IS_PLATFORM } from 'common'
import { useCallback, useEffect, useMemo } from 'react'

import type { AdvisorSignalItem } from './AdvisorPanel.types'
import { useBannedIPsQuery } from '@/data/banned-ips/banned-ips-query'
import type { IPData } from '@/data/banned-ips/banned-ips-query'
import { BannedIPKeys } from '@/data/banned-ips/keys'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
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
    category: 'security' as const,
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
  const queryClient = useQueryClient()
  const query = useBannedIPsQuery({ projectRef }, { enabled })
  const { data } = query
  const isEnabled = enabled && !!projectRef
  const projectQuery = useProjectDetailQuery(
    { ref: projectRef },
    { enabled: isEnabled && IS_PLATFORM }
  )
  const isLoading =
    isEnabled && IS_PLATFORM && (projectQuery.isPending || (query.isEnabled && query.isPending))
  const error =
    isEnabled && IS_PLATFORM ? (projectQuery.error ?? (query.isEnabled ? query.error : null)) : null
  const isError = error !== null
  const isSuccess =
    isEnabled &&
    (!IS_PLATFORM || (projectQuery.isSuccess && (!query.isEnabled || query.isSuccess))) &&
    !isError
  const refetch = async () => {
    if (!isEnabled || !IS_PLATFORM) return
    if (projectQuery.isError) await projectQuery.refetch()
    await queryClient.invalidateQueries({ queryKey: BannedIPKeys.list(projectRef), exact: true })
  }

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

  useEffect(() => {
    if (!data) return

    const hasStaleBannedIPDismissal = dismissedKeys.some(
      (key) =>
        key.startsWith('signal:banned-ip:') &&
        !signalItems.some((item) => item.dismissalKey === key)
    )
    if (!hasStaleBannedIPDismissal) return

    const activeKeys = new Set(signalItems.map((item) => item.dismissalKey))
    setDismissedKeys((current) =>
      current.filter((key) => (key.startsWith('signal:banned-ip:') ? activeKeys.has(key) : true))
    )
  }, [data, signalItems, dismissedKeys, setDismissedKeys])

  const formattedData = useMemo(
    () => signalItems.filter((item) => !dismissedKeySet.has(item.dismissalKey)),
    [signalItems, dismissedKeySet]
  )

  return {
    data: isEnabled ? formattedData : [],
    dismissSignal,
    isPending: isLoading,
    isLoading,
    isError,
    isSuccess,
    error,
    isFetching: isEnabled && IS_PLATFORM && (projectQuery.isFetching || query.isFetching),
    refetch,
  }
}
