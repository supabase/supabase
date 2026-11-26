import dayjs from 'dayjs'

import type { ApiKeyLastUsed } from '@/data/analytics/api-keys-last-used-query'

/** Maps a legacy project API key's tag to its telemetry key type */
export function getLegacyApiKeyType(tags: string | undefined) {
  if (tags === 'anon') return 'legacy_anon' as const
  if (tags === 'service_role') return 'legacy_service_role' as const
  return undefined
}

export function getLastUsedAPIKeys(
  apiKeys: {
    tags: string
    api_key: string
  }[],
  logData: ApiKeyLastUsed[] | null | undefined
) {
  if (apiKeys.length < 1 || !logData || logData.length < 1) {
    return {}
  }

  const now = dayjs()

  return apiKeys.reduce(
    (a, i) => {
      const entry = logData?.find(
        ({ role, signaturePrefix }) =>
          role &&
          signaturePrefix &&
          i.tags.indexOf(role) >= 0 &&
          i.api_key.split('.')[2]?.startsWith(signaturePrefix)
      )?.timestamp

      if (entry) {
        a[i.api_key] = dayjs.duration(now.diff(dayjs(entry))).humanize(false)
      }

      return a
    },
    {} as { [apikey: string]: string }
  )
}
