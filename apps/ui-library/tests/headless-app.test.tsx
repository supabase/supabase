import type { OAuthGrant } from '@supabase/supabase-js'
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConnectedAgents } from '@/registry/default/blocks/headless-app-tanstack/components/connected-agents'

const { listGrants, revokeGrant } = vi.hoisted(() => ({
  listGrants: vi.fn(),
  revokeGrant: vi.fn(),
}))

vi.mock('@/registry/default/clients/tanstack/lib/supabase/client', () => ({
  createClient: () => ({ auth: { oauth: { listGrants, revokeGrant } } }),
}))

const serverUrl = 'https://example.supabase.co/functions/v1/mcp-server'
const grant: OAuthGrant = {
  client: { id: 'test-agent', name: 'Test agent', uri: '', logo_uri: '' },
  granted_at: '2026-09-01T00:00:00Z',
  scopes: ['openid'],
}
const success = (grants: OAuthGrant[]) => ({ data: grants, error: null })

let container: HTMLDivElement
let root: Root
let writeText: ReturnType<typeof vi.fn>

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })
  vi.resetAllMocks()
  listGrants.mockResolvedValue(success([]))
  revokeGrant.mockResolvedValue({ error: null })
  writeText = vi.fn().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
  container = document.createElement('div')
  document.body.append(container)
  root = createRoot(container)
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

const render = async () => {
  await act(async () =>
    root.render(<ConnectedAgents mcpServerUrl={serverUrl} productName="Acme" />)
  )
}

const button = (label: string) => {
  const match = Array.from(container.querySelectorAll('button')).find(
    (button) => button.textContent === label
  )
  if (!match) throw new Error(`Missing button: ${label}`)
  return match
}

const click = async (label: string) => {
  await act(async () => button(label).click())
}

describe('Headless app connections', () => {
  it('keeps the server URL available after an agent is authorized', async () => {
    listGrants.mockResolvedValue(success([grant]))
    await render()
    expect(container.textContent).toContain(serverUrl)
    expect(container.textContent).toContain('Test agent')
    await click('Copy URL')
    expect(writeText).toHaveBeenCalledWith(serverUrl)
    await click('Copy prompt')
    expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining('Then call whoami'))
    expect(writeText).toHaveBeenLastCalledWith(expect.stringContaining(serverUrl))
  })

  it('shows a recovery message if clipboard access is denied', async () => {
    writeText.mockRejectedValue(new Error('Clipboard denied'))
    await render()
    await click('Copy URL')
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      'Select and copy the server URL above.'
    )
    expect(button('Copy URL').disabled).toBe(false)
    writeText.mockResolvedValue(undefined)
    await click('Copy URL')
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('distinguishes loading and failure from an empty grant list, and supports retry', async () => {
    const pending = Promise.withResolvers<ReturnType<typeof success>>()
    listGrants.mockReturnValueOnce(pending.promise)
    await render()
    expect(container.textContent).toContain('Loading connected agents...')
    expect(container.textContent).not.toContain('No agents authorized yet.')
    await act(async () => pending.reject(new Error('Network unavailable')))
    expect(container.textContent).toContain('Unable to load connected agents. Network unavailable')
    expect(container.textContent).not.toContain('No agents authorized yet.')
    expect(container.textContent).toContain(serverUrl)
    await click('Refresh')
    expect(container.textContent).toContain('No agents authorized yet.')
    expect(container.querySelector('[role="alert"]')).toBeNull()
  })

  it('refreshes grants when the customer returns from authorizing an agent', async () => {
    listGrants.mockResolvedValueOnce(success([])).mockResolvedValueOnce(success([grant]))
    await render()
    await act(async () => window.dispatchEvent(new Event('focus')))
    expect(listGrants).toHaveBeenCalledTimes(2)
    expect(container.textContent).toContain('Test agent')
  })

  it('does not allow a stale list response to restore a revoked grant', async () => {
    const pending = Promise.withResolvers<ReturnType<typeof success>>()
    listGrants.mockResolvedValueOnce(success([grant])).mockReturnValueOnce(pending.promise)
    await render()
    // Start revocation and an older list request in the same render window.
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
      button('Revoke access').click()
    })
    expect(revokeGrant).toHaveBeenCalledWith({ clientId: grant.client.id })
    expect(container.textContent).not.toContain('Test agent')
    await act(async () => pending.resolve(success([grant])))
    expect(container.textContent).not.toContain('Test agent')
    expect(container.textContent).toContain('No agents authorized yet.')
  })

  it('prevents duplicate revocations and recovers after a rejected request', async () => {
    const pending = Promise.withResolvers<{ error: null }>()
    listGrants.mockResolvedValue(success([grant]))
    revokeGrant.mockReturnValueOnce(pending.promise)
    await render()
    await act(async () => {
      button('Revoke access').click()
      button('Revoke access').click()
    })
    expect(revokeGrant).toHaveBeenCalledTimes(1)
    expect(button('Revoking access...').disabled).toBe(true)
    await act(async () => pending.reject(new Error('Network unavailable')))
    expect(container.textContent).toContain('Test agent')
    expect(container.textContent).toContain('Unable to revoke access. Network unavailable')
    expect(button('Revoke access').disabled).toBe(false)
    await click('Revoke access')
    expect(container.textContent).not.toContain('Test agent')
  })

  it('keeps the grant when Supabase returns a revocation error', async () => {
    listGrants.mockResolvedValue(success([grant]))
    revokeGrant.mockResolvedValueOnce({ error: new Error('Session expired') })
    await render()
    await click('Revoke access')
    expect(container.textContent).toContain('Unable to revoke access. Session expired')
    expect(container.textContent).toContain('Test agent')
    expect(button('Revoke access').disabled).toBe(false)
  })
})
