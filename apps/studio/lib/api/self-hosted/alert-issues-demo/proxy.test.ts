import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()

async function load() {
  vi.resetModules()
  vi.stubEnv('ALERT_ISSUES_DEMO', 'mock')
  vi.stubEnv('LOGFLARE_URL', '')
  vi.stubEnv('LOGFLARE_PRIVATE_ACCESS_TOKEN', '')
  const { resetDemoStores } = await import('./store')
  resetDemoStores()
  return {
    proxy: await import('../alert-issues'),
    route: await import('@/routes/api/platform/projects/$ref/alerts/issues/index'),
  }
}

describe('alert issues demo mode through the self-hosted proxy', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('serves the alert issues route from the simulator without Logflare', async () => {
    const { route } = await load()
    const handlers = route.Route.options.server?.handlers
    if (!handlers || typeof handlers === 'function' || !handlers.GET)
      throw new Error('no GET handler')

    const response = await handlers.GET({
      request: new Request('http://localhost/api/platform/projects/default/alerts/issues'),
      params: { ref: 'default' },
    } as never)
    if (!(response instanceof Response)) throw new Error('expected a Response')
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.map((issue: { title: string }) => issue.title)).toContain(
      'RLS Disabled in Public: public.orders'
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('passes simulated client errors through like Logflare ones', async () => {
    const { proxy } = await load()

    const result = await proxy.applyAlertIssueAction({
      projectRef: 'default',
      alertIssueId: 'edge-5xx-resize-image',
      action: 'acknowledge',
    })

    expect(result.data).toBeUndefined()
    expect(result.error && proxy.getProxyErrorStatus(result.error)).toBe(409)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
