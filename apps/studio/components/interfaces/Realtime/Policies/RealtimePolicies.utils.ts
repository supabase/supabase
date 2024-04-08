import { PostgresPolicy } from '@supabase/postgres-meta'
import { groupBy } from 'lodash'

import { RealtimeChannel } from 'data/realtime/channels-query'

/**
 * Formats the policies from the objects table in the storage schema
 * to be consumable for the storage policies dashboard.
 * Output: [{ channel: <string>, policies: <Policy[]> }]
 * @param {Array} policies: All policies from a table in a schema
 */
export const formatPoliciesForRealtime = (
  channels: RealtimeChannel[],
  policies: PostgresPolicy[]
): { name: string; policies: PostgresPolicy[] }[] => {
  if (policies.length === 0) {
    return [{ name: 'Ungrouped', policies: policies }]
  }

  /**
   * Format policies from storage objects to:
   *  - Include channel name
   *  Note, if the policy definition has no channel_id, we skip the formatting
   */
  const formattedPolicies = formatStoragePolicies(channels, policies)

  /**
   * Package policies by grouping them by channel:
   * [{ name: <string>, policies: <Policy[]> }]
   */
  const policiesByChannel = groupBy(formattedPolicies, (p) => p.channel)
  const grouped = Object.keys(policiesByChannel).map((channelName) => {
    return { name: channelName, policies: policiesByChannel[channelName] }
  })

  return grouped
}

const formatStoragePolicies = (channels: RealtimeChannel[], policies: PostgresPolicy[]) => {
  const formattedPolicies = policies.map((policy) => {
    try {
      const { definition: policyDefinition, check: policyCheck } = policy

      const channelId =
        policyDefinition !== null
          ? extractChannelIdFromDefinition(policyDefinition)
          : extractChannelIdFromDefinition(policyCheck)

      const channelName =
        policyDefinition !== null
          ? extractChannelNameFromDefinition(policyDefinition)
          : extractChannelNameFromDefinition(policyCheck)

      const foundChannel = channels.find(
        (channel) => channel.id === channelId || channel.name === channelName
      )
      if (foundChannel) {
        // [JOSHEN TODO] We cannot override definition here anymore cause we're gonna be using the auth editor
        // const definition = policyDefinition !== null ? policyDefinition : policyCheck
        return {
          ...policy,
          channel: foundChannel.name,
        }
      }
    } catch {}

    return { ...policy, channel: 'Ungrouped' }
  })

  return formattedPolicies
}

const extractChannelIdFromDefinition = (definition: string | null) => {
  const definitionSegments = definition?.replace('(', '').replace(')', '').split(' AND ') ?? []
  const [channelDefinition] = definitionSegments.filter((segment) => segment.includes('channel_id'))
  return channelDefinition ? +channelDefinition.split('=')[1] : null
}

const extractChannelNameFromDefinition = (definition: string | null) => {
  const definitionSegments = definition?.split(' AND ') ?? []
  const [channelDefinition] = definitionSegments.filter((segment) => segment.includes('name'))
  return channelDefinition ? channelDefinition.split("'")[1] : null
}
