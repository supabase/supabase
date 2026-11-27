import type { ConnectionStringPooler } from '@/components/interfaces/ConnectSheet/Connect.types'

export type ConnectionOption = {
  valueType: 'session_pooler' | 'direct' | 'transaction_pooler' | 'dedicated_pooler'
  label: string
  /** When to use this connection, in a few words */
  description: string
  uri: string
}

/**
 * Orders a project's connection strings for copying, session pooler first
 * because it's the one people copy most from the Connect sheet. With a
 * dedicated pooler, the shared transaction pooler is offered as the IPv4
 * option, matching the Connect sheet's "Use IPv4 connection" switch. Each
 * distinct string appears once: projects without a pooler (local CLI, high
 * availability) resolve every option to the direct connection.
 */
export function getConnectionOptions(pooler?: ConnectionStringPooler): ConnectionOption[] {
  if (!pooler) return []

  // The IPv4 add-on makes direct and dedicated pooler connections reachable over IPv4
  const ipv6Note = pooler.ipv4SupportedForDedicatedPooler ? '' : ' IPv6 only.'
  const hasDedicatedPooler = !!pooler.transactionDedicated

  const candidates: ConnectionOption[] = [
    {
      valueType: 'session_pooler',
      label: 'Session pooler',
      description: 'For persistent servers on IPv4 networks.',
      uri: pooler.sessionShared,
    },
    {
      valueType: 'direct',
      label: 'Direct connection',
      description: `For persistent servers and migrations.${ipv6Note}`,
      uri: pooler.direct ?? '',
    },
    ...(hasDedicatedPooler
      ? [
          {
            valueType: 'dedicated_pooler' as const,
            label: 'Transaction pooler',
            description: `For serverless and edge functions, through your dedicated pooler.${ipv6Note}`,
            uri: pooler.transactionDedicated ?? '',
          },
          {
            valueType: 'transaction_pooler' as const,
            label: 'Transaction pooler (IPv4)',
            description: 'For serverless and edge functions on IPv4 networks.',
            uri: pooler.transactionShared,
          },
        ]
      : [
          {
            valueType: 'transaction_pooler' as const,
            label: 'Transaction pooler',
            description: 'For serverless and edge functions with many short-lived connections.',
            uri: pooler.transactionShared,
          },
        ]),
  ]

  const seen = new Set<string>()
  return candidates.filter(({ uri }) => {
    if (!uri || seen.has(uri)) return false
    seen.add(uri)
    return true
  })
}
