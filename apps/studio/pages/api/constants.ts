const PUBLIC_URL = new URL(process.env.SUPABASE_PUBLIC_URL || 'http://localhost:8000')

export const IS_VELA_PLATFORM = process.env.PUBLIC_PLATFORM === 'vela'
export const VELA_PLATFORM_URL = process.env.VELA_PLATFORM_URL

// Use LOGFLARE_URL until analytics/v1/ routing is supported
export const PROJECT_ANALYTICS_URL = `${process.env.LOGFLARE_URL}/api/`

export const PROJECT_REST_URL = `${PUBLIC_URL.origin}/rest/v1/`
export const PROJECT_ENDPOINT = PUBLIC_URL.host
export const PROJECT_ENDPOINT_PROTOCOL = PUBLIC_URL.protocol.replace(':', '')

export const DEFAULT_HOME = '/org'

export const DEFAULT_PROJECT = {
  id: 1,
  ref: '1',
  name: process.env.DEFAULT_PROJECT_NAME || 'Default Project',
  organization_id: 1,
  cloud_provider: 'localhost',
  status: 'ACTIVE_HEALTHY',
  region: 'local',
  inserted_at: '2021-08-02T06:40:40.646Z',
}

export const DEFAULT_PROJECT_2 = {
  id: 2,
  ref: '2',
  name: 'Second Project',
  organization_id: 1,
  cloud_provider: 'localhost',
  status: 'ACTIVE_HEALTHY',
  region: 'local',
  inserted_at: '2021-08-02T06:40:40.646Z',
}

export const DEFAULT_ORGANIZATION = {
  id: 1,
  name: process.env.DEFAULT_ORGANIZATION_NAME || 'Default Organization',
  slug: '1',
  billing_email: 'billing@supabase.co',
  plan: {
    id: 'enterprise',
    name: 'Enterprise',
  },
}
