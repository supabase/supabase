import type { OAuthClient } from '@supabase/supabase-js'

export const OAUTH_APP_REGISTRATION_TYPE_OPTIONS = [
  { name: 'Manual', value: 'manual' },
  { name: 'Dynamic', value: 'dynamic' },
]

export const OAUTH_APP_CLIENT_TYPE_OPTIONS = [
  { name: 'Public', value: 'public' },
  { name: 'Confidential', value: 'confidential' },
]

interface FilterOAuthAppsParams {
  apps: OAuthClient[]
  searchString?: string
  registrationTypes?: string[]
  clientTypes?: string[]
}

export function filterOAuthApps({
  apps,
  searchString,
  registrationTypes = [],
  clientTypes = [],
}: FilterOAuthAppsParams): OAuthClient[] {
  return apps.filter((app) => {
    // Filter by search string
    if (searchString) {
      const searchLower = searchString.toLowerCase()
      const matchesName = app.client_name.toLowerCase().includes(searchLower)
      const matchesClientId = app.client_id.toLowerCase().includes(searchLower)
      if (!matchesName && !matchesClientId) {
        return false
      }
    }

    // Filter by registration type
    if (registrationTypes.length > 0) {
      if (!registrationTypes.includes(app.registration_type)) {
        return false
      }
    }

    // Filter by client type
    if (clientTypes.length > 0) {
      if (!clientTypes.includes(app.client_type)) {
        return false
      }
    }

    return true
  })
}
