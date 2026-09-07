import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getAssistantProjectAccess } from './project-access'
import { mswServer } from '@/tests/lib/msw'

vi.mock('@/lib/constants', async (original) => ({
  ...(await original<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))
// Importing the legacy policy resolver would make this integration test fail.
vi.mock('@/lib/ai/ai-details', () => {
  throw new Error('Legacy AI policy must not be imported')
})
const base = 'http://localhost:3000/api/platform'
const context = { projectRef: 'project', orgSlug: 'org', authorization: 'Bearer current' }
let tags: string[], projectOrg: number, isHipaa: boolean
let headers: string[]
beforeEach(() => {
  tags = []
  projectOrg = 1
  isHipaa = false
  headers = []
  mswServer.use(
    http.get(`${base}/organizations`, ({ request }) => {
      headers.push(request.headers.get('authorization') ?? '')
      return HttpResponse.json([{ id: 1, slug: 'org', opt_in_tags: tags }])
    }),
    http.get(`${base}/projects/project`, ({ request }) => {
      headers.push(request.headers.get('authorization') ?? '')
      return HttpResponse.json({ ref: 'project', organization_id: projectOrg })
    }),
    http.get(`${base}/projects/project/settings`, ({ request }) => {
      headers.push(request.headers.get('authorization') ?? '')
      return HttpResponse.json({ is_sensitive: true })
    }),
    http.get(`${base}/organizations/org/billing/subscription`, ({ request }) => {
      headers.push(request.headers.get('authorization') ?? '')
      return HttpResponse.json({
        addons: isHipaa ? [{ supabase_prod_id: 'addon_security_hipaa' }] : [],
      })
    }),
    http.get(`${base}/organizations/org/entitlements`, ({ request }) => {
      headers.push(request.headers.get('authorization') ?? '')
      return HttpResponse.json({
        entitlements: [{ feature: { key: 'assistant.advance_model' }, hasAccess: true }],
      })
    })
  )
})
describe('Assistant integration platform access', () => {
  it('does not inherit or interpret organization AI opt-in tags', async () => {
    const withoutConsent = await getAssistantProjectAccess(context)
    tags = ['AI_SQL_GENERATOR_OPT_IN', 'AI_DATA_OPT_IN', 'a-future-legacy-permission']
    expect(await getAssistantProjectAccess(context)).toEqual(withoutConsent)
    expect(withoutConsent).toEqual({
      orgSlug: 'org',
      hasHipaaAddon: false,
      isSensitive: true,
      hasAccessToAdvanceModel: true,
    })
    expect(headers).toHaveLength(10)
    expect(headers.every((header) => header === context.authorization)).toBe(true)
  })
  it('retains platform project ownership and privacy constraints', async () => {
    isHipaa = true
    expect(await getAssistantProjectAccess(context)).toMatchObject({
      orgSlug: 'org',
      hasHipaaAddon: true,
      isSensitive: true,
    })
    projectOrg = 2
    expect(await getAssistantProjectAccess(context)).toMatchObject({
      orgSlug: undefined,
      hasHipaaAddon: undefined,
      hasAccessToAdvanceModel: false,
    })
  })
  it('fails closed when platform access cannot be verified', async () => {
    mswServer.use(
      http.get(`${base}/projects/project`, () =>
        HttpResponse.json({ message: 'Forbidden' }, { status: 403 })
      )
    )
    await expect(getAssistantProjectAccess(context)).rejects.toThrow()
  })
})
