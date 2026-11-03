import { http, HttpResponse } from 'msw'

import { mswServer } from './msw'
import { API_URL } from '@/lib/constants'

const STORAGE_HOST = 'abcdef.supabase.co'

/**
 * Mocks everything a project Supabase client needs to sign storage URLs: the project endpoint,
 * the temporary API key, and the storage `sign` endpoint. Returns the request bodies the
 * storage endpoint received.
 */
export const mockStorageSigning = (signedPath = '/object/sign/my-bucket/photo.png?token=abc') => {
  const bodies: Array<Record<string, unknown>> = []

  mswServer.use(
    http.get(`${API_URL}/platform/projects/:ref/settings`, () =>
      HttpResponse.json({ app_config: { endpoint: STORAGE_HOST, protocol: 'https' } })
    ),
    http.get(`${API_URL}/platform/projects/:ref/billing/addons`, () =>
      HttpResponse.json({ selected_addons: [], available_addons: [] })
    ),
    http.get(`${API_URL}/v1/projects/:ref/custom-hostname`, () =>
      HttpResponse.json({ status: '0_no_hostname_configured', customDomain: '' })
    ),
    http.post(`${API_URL}/platform/projects/:ref/api-keys/temporary`, () =>
      HttpResponse.json({ api_key: 'test-key' })
    ),
    http.post(`https://${STORAGE_HOST}/storage/v1/object/sign/*`, async ({ request }) => {
      bodies.push((await request.json()) as Record<string, unknown>)
      return HttpResponse.json({ signedURL: signedPath })
    })
  )

  return bodies
}
