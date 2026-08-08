import createClient from 'openapi-fetch'

import type { paths } from './management-api-schema'

export const client = createClient<paths>({
  baseUrl: '/api/supabase-proxy',
})
