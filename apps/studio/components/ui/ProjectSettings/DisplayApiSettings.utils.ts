import dayjs from 'dayjs'

import type { ApiKeyLastUsed } from '@/data/analytics/api-keys-last-used-query'

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
        ({ role, signature_prefix }) =>
          role &&
          signature_prefix &&
          i.tags.indexOf(role) >= 0 &&
          i.api_key.split('.')[2]?.startsWith(signature_prefix)
      )?.timestamp

      if (entry) {
        a[i.api_key] = dayjs.duration(now.diff(dayjs(entry))).humanize(false)
      }

      return a
    },
    {} as { [apikey: string]: string }
  )
}
