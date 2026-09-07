import { webcrypto } from 'node:crypto'
import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AiAssistantStateContextProvider,
  useAiAssistantState,
  useAiAssistantStateSnapshot,
  type AiAssistantState,
} from './ai-assistant-state'
import { AssistantSetup } from '@/components/ui/AIAssistantPanel/AssistantSetup'
import { organizationKeys } from '@/data/organizations/keys'
import { projectKeys } from '@/data/projects/keys'
import { getQueryClient } from '@/data/query-client'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const controls = vi.hoisted(() => ({
  flag: undefined as unknown,
  platform: true,
  userId: 'user-a',
  project: 'project-a',
  stored: undefined as unknown,
  put: vi.fn(),
  auth: vi.fn(),
}))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: () => controls.flag,
  useUser: () => ({ id: controls.userId }),
  useIsLoggedIn: () => true,
  useParams: () => ({ ref: controls.project }),
  gotrueClient: {
    getSession: async () => ({
      data: { session: { access_token: 'studio-token', user: { id: controls.userId } } },
    }),
  },
}))
vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  get IS_PLATFORM() {
    return controls.platform
  },
}))
vi.mock('idb', () => ({
  openDB: async () => ({ get: async () => controls.stored, put: controls.put }),
}))
vi.mock('@/lib/assistant/client', () => ({ getAssistantRequestHeaders: controls.auth }))
const cloudId = '11111111-1111-4111-8111-111111111111'
const row = {
  id: cloudId,
  name: 'Cloud conversation',
  revision: 0,
  project_ref: 'project-a',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
const permissions = {
  selection: 'general',
  hasConsented: true,
  consentVersion: 1,
  options: [{ value: 'general', label: 'General', description: 'General help', disabled: false }],
  capabilities: { includeContext: false },
}
let state: AiAssistantState
let calls: string[]
function Probe() {
  const currentState = useAiAssistantState()
  state = currentState
  const projectRef = controls.project
  useEffect(() => {
    currentState.setContext({
      projectRef,
      ...(!currentState.useAssistantBackend ? { orgSlug: 'org' } : {}),
    })
  }, [currentState, projectRef])
  return null
}
function Tree() {
  return (
    <AiAssistantStateContextProvider>
      <Probe />
    </AiAssistantStateContextProvider>
  )
}
function Onboarding() {
  const snap = useAiAssistantStateSnapshot()
  if (snap.isInitialized) return <p>Chat ready</p>
  return <AssistantSetup />
}
function AutomaticMessage({ onSend }: { onSend: (subject: string) => void }) {
  const currentState = useAiAssistantState()
  const snap = useAiAssistantStateSnapshot()
  const subject = controls.userId
  useEffect(() => {
    if (snap.isInitialized && currentState.isInitialized) onSend(subject)
  }, [currentState, snap.isInitialized, subject, onSend])
  return null
}
beforeEach(() => {
  controls.platform = true
  controls.flag = undefined
  controls.userId = 'user-a'
  controls.project = 'project-a'
  controls.stored = undefined
  controls.put.mockReset()
  controls.auth.mockReset().mockResolvedValue({
    Authorization: 'Bearer assistant',
  })
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_SUPABASE_URL', 'https://assistant.example')
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY', 'key')
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_API_URL', 'https://assistant.example')
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_BACKEND', 'false')
  const client = getQueryClient()
  client.clear()
  client.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } })
  for (const ref of ['project-a', 'project-b'])
    client.setQueryData(projectKeys.detail(ref), { ref, organization_id: 1, connectionString: '' })
  client.setQueryData(organizationKeys.list(), [{ id: 1, slug: 'org' }])
  calls = []
  mswServer.use(
    http.get('https://assistant.example/v1/me', ({ request }) => {
      calls.push(request.url)
      return HttpResponse.json({ user_id: 'assistant-user', connections: [{ org_slug: 'org' }] })
    }),
    http.get('https://assistant.example/v1/projects/:ref/permissions', ({ request }) => {
      calls.push(request.url)
      return HttpResponse.json(permissions)
    }),
    http.get('https://assistant.example/v1/projects/:ref/conversations', ({ request }) => {
      calls.push(request.url)
      return HttpResponse.json({ conversations: [row] })
    }),
    http.get('https://assistant.example/v1/conversations/:id', ({ request }) => {
      calls.push(request.url)
      return HttpResponse.json({
        conversation: row,
        messages: [{ id: 'old', role: 'user', parts: [{ type: 'text', text: 'Cloud history' }] }],
        nextCursor: null,
      })
    })
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  getQueryClient().clear()
})
describe('assistant provider rollout containment', () => {
  it('clears the previous scope before automatic messages can run for a different account, organization, and project', async () => {
    controls.flag = true
    getQueryClient().setQueryData(projectKeys.detail('project-b'), {
      ref: 'project-b',
      organization_id: 2,
      connectionString: '',
    })
    getQueryClient().setQueryData(organizationKeys.list(), [
      { id: 1, slug: 'org' },
      { id: 2, slug: 'other-org' },
    ])
    const onSend = vi.fn()
    let releaseIdentity: (() => void) | undefined
    const identityReady = new Promise<void>((resolve) => {
      releaseIdentity = resolve
    })
    mswServer.use(
      http.get('https://assistant.example/v1/me', async () => {
        if (controls.userId === 'user-b') await identityReady
        return HttpResponse.json({
          user_id: controls.userId,
          connections: [{ org_slug: controls.userId === 'user-b' ? 'other-org' : 'org' }],
        })
      }),
      http.get('https://assistant.example/v1/projects/project-b/permissions', () =>
        HttpResponse.json({ ...permissions, hasConsented: false })
      )
    )
    const tree = () => (
      <AiAssistantStateContextProvider>
        <Probe />
        <AutomaticMessage onSend={onSend} />
      </AiAssistantStateContextProvider>
    )
    const view = customRender(tree(), { queryClient: getQueryClient() })
    await waitFor(() => expect(onSend).toHaveBeenCalledWith('user-a'))
    controls.userId = 'user-b'
    controls.project = 'project-b'
    view.rerender(tree())
    expect(state.isInitialized).toBe(false)
    expect(state.chats).toEqual({})
    expect(onSend).not.toHaveBeenCalledWith('user-b')
    await act(async () => releaseIdentity?.())
    await waitFor(() => expect(state.isProjectConsentRequired).toBe(true))
    expect(state.context.orgSlug).toBe('other-org')
    expect(onSend).not.toHaveBeenCalledWith('user-b')
    expect(calls.some((url) => url.includes('project-b/conversations'))).toBe(false)
    view.unmount()
  })

  it('opens OAuth consent using the current session, then asks for project permissions before chat', async () => {
    controls.flag = true
    vi.stubGlobal('crypto', webcrypto)
    const openPopup = vi.spyOn(window, 'open').mockReturnValue(window)
    vi.spyOn(window, 'close').mockImplementation(() => {})
    let isConnected = false
    let hasConsented = false
    let consentWindowOpened = false
    const completeRequests: unknown[] = []
    mswServer.use(
      http.get('https://assistant.example/v1/me', () =>
        HttpResponse.json({
          user_id: 'assistant-user',
          connections: isConnected ? [{ org_slug: 'org' }] : [],
        })
      ),
      http.get('https://assistant.example/oauth/start', ({ request }) => {
        expect(request.headers.get('authorization')).toBe('Bearer assistant')
        expect(request.headers.has('x-platform-authorization')).toBe(false)
        const url = new URL(request.url)
        expect(url.searchParams.get('org_slug')).toBe('org')
        expect(url.searchParams.get('code_challenge')).toMatch(/^[\w-]{43}$/)
        consentWindowOpened = true
        return HttpResponse.json({
          state: 'oauth-state',
          authorize_url: `${window.location.origin}/#oauth-consent`,
        })
      }),
      http.post('https://assistant.example/oauth/complete', async ({ request }) => {
        completeRequests.push(await request.json())
        isConnected = true
        return HttpResponse.json({ connected: true })
      }),
      http.get('https://assistant.example/v1/projects/:ref/permissions', () =>
        HttpResponse.json({ ...permissions, hasConsented })
      ),
      http.post('https://assistant.example/v1/projects/:ref/permissions', async ({ request }) => {
        expect(await request.json()).toEqual({
          org_slug: 'org',
          selection: 'general',
          consentVersion: 1,
        })
        hasConsented = true
        return HttpResponse.json({ ...permissions, hasConsented })
      })
    )
    const view = customRender(
      <AiAssistantStateContextProvider>
        <Probe />
        <Onboarding />
      </AiAssistantStateContextProvider>,
      { queryClient: getQueryClient() }
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Connect Assistant' }))
    expect(openPopup).toHaveBeenCalledOnce()
    expect(screen.queryByText('Chat ready')).not.toBeInTheDocument()
    await waitFor(() => expect(consentWindowOpened).toBe(true))
    await waitFor(() => expect(window.location.hash).toBe('#oauth-consent'))
    act(() => {
      window.dispatchEvent(
        new MessageEvent('message', {
          origin: 'https://assistant.example',
          source: window,
          data: { type: 'assistant-oauth-code', state: 'oauth-state', code: 'oauth-code' },
        })
      )
    })
    fireEvent.click(await screen.findByRole('button', { name: 'Choose permissions' }))
    expect(screen.queryByText('Chat ready')).not.toBeInTheDocument()
    expect(calls.some((url) => url.includes('conversations'))).toBe(false)
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await screen.findByText('Chat ready')
    expect(completeRequests).toEqual([
      {
        state: 'oauth-state',
        code: 'oauth-code',
        code_verifier: expect.stringMatching(/^[\w-]{43}$/),
      },
    ])
    expect(state.chatInstances[cloudId]).toBeDefined()
    view.unmount()
  })

  it('requests OAuth consent before fetching permissions or creating a conversation', async () => {
    controls.flag = true
    mswServer.use(
      http.get('https://assistant.example/v1/me', ({ request }) => {
        calls.push(request.url)
        return HttpResponse.json({ user_id: 'assistant-user', connections: [] })
      })
    )
    const view = customRender(<Tree />, { queryClient: getQueryClient() })
    await waitFor(() => expect(state.oauthRequiredOrgSlug).toBe('org'))
    expect(state.isInitialized).toBe(false)
    expect(state.chats).toEqual({})
    expect(state.isProjectConsentRequired).toBe(false)
    expect(calls).toEqual(['https://assistant.example/v1/me'])
    view.unmount()
  })

  it('requires consent for the selected organization even when another one is connected', async () => {
    controls.flag = true
    mswServer.use(
      http.get('https://assistant.example/v1/me', () =>
        HttpResponse.json({ user_id: 'assistant-user', connections: [{ org_slug: 'other-org' }] })
      )
    )
    const view = customRender(<Tree />, { queryClient: getQueryClient() })
    await waitFor(() => expect(state.oauthRequiredOrgSlug).toBe('org'))
    expect(calls).toEqual([])
    view.unmount()
  })

  it('requires project permissions after OAuth consent and before conversation hydration', async () => {
    controls.flag = true
    mswServer.use(
      http.get('https://assistant.example/v1/projects/:ref/permissions', ({ request }) => {
        calls.push(request.url)
        return HttpResponse.json({ ...permissions, hasConsented: false })
      })
    )
    const view = customRender(<Tree />, { queryClient: getQueryClient() })
    await waitFor(() => expect(state.isProjectConsentRequired).toBe(true))
    expect(state.oauthRequiredOrgSlug).toBeUndefined()
    expect(state.isInitialized).toBe(false)
    expect(state.chats).toEqual({})
    expect(calls).toEqual([
      'https://assistant.example/v1/me',
      'https://assistant.example/v1/projects/project-a/permissions?org_slug=org',
    ])
    view.unmount()
  })

  it('offers reconnect when an existing OAuth grant fails during permission discovery', async () => {
    controls.flag = true
    mswServer.use(
      http.get('https://assistant.example/v1/projects/:ref/permissions', () =>
        HttpResponse.json(
          { message: 'Reconnect Assistant', code: 'oauth_expired', org_slug: 'org' },
          { status: 409 }
        )
      )
    )
    const view = customRender(<Tree />, { queryClient: getQueryClient() })
    await waitFor(() => expect(state.oauthRequiredOrgSlug).toBe('org'))
    expect(state.initializationError).toBeUndefined()
    expect(state.chats).toEqual({})
    view.unmount()
  })

  it('offers a reload after detail hydration fails instead of opening an empty conversation', async () => {
    controls.flag = true
    mswServer.use(
      http.get('https://assistant.example/v1/conversations/:id', () =>
        HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
      )
    )
    const view = customRender(<Tree />, { queryClient: getQueryClient() })
    await waitFor(() => expect(state.initializationError).toBeDefined())
    expect(state.chatInstances[cloudId]).toBeUndefined()
    expect(controls.put).not.toHaveBeenCalled()
    view.unmount()
  })
  it.each([
    'NEXT_PUBLIC_ASSISTANT_SUPABASE_URL',
    'NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_ASSISTANT_API_URL',
    'self-hosted',
  ])('does not call the worker with %s unavailable', async (missing) => {
    controls.flag = true
    if (missing === 'self-hosted') controls.platform = false
    else vi.stubEnv(missing, '')
    const view = customRender(<Tree />, { queryClient: getQueryClient() })
    await waitFor(() => expect(state.isInitialized).toBe(true))
    expect(state.useAssistantBackend).toBe(false)
    expect(controls.auth).not.toHaveBeenCalled()
    view.unmount()
  })

  it.each([undefined, false])(
    'makes zero worker/auth calls while flag=%s, including with no local history',
    async (flag) => {
      controls.flag = flag
      const view = customRender(<Tree />, { queryClient: getQueryClient() })
      await waitFor(() => expect(state.isInitialized).toBe(true))
      expect(state.useAssistantBackend).toBe(false)
      expect(state.context.orgSlug).toBe('org')
      expect(calls).toEqual([])
      expect(controls.auth).not.toHaveBeenCalled()
      view.unmount()
    }
  )
  it('resets transports in both directions, never persisting cloud history to IndexedDB', async () => {
    const view = customRender(<Tree />, { queryClient: getQueryClient() })
    await waitFor(() => expect(state.isInitialized).toBe(true))
    const local = state.chatInstances[state.activeChatId!]
    const stopLocal = vi.spyOn(local, 'stop')
    controls.flag = true
    view.rerender(<Tree />)
    await waitFor(() => {
      expect(state.initializationError).toBeUndefined()
      expect(state.chatInstances[cloudId]?.messages).toHaveLength(1)
    })
    expect(stopLocal).toHaveBeenCalled()
    const stopCloud = vi.spyOn(state.chatInstances[cloudId], 'stop')
    controls.put.mockClear()
    controls.flag = false
    view.rerender(<Tree />)
    await waitFor(() => expect(state.isInitialized && !state.useAssistantBackend).toBe(true))
    expect(stopCloud).toHaveBeenCalled()
    expect(state.chats[cloudId]).toBeUndefined()
    expect(state.context.orgSlug).toBe('org')
    // Saving after rollback can only contain the newly loaded local store.
    await new Promise((resolve) => setTimeout(resolve, 550))
    for (const call of controls.put.mock.calls)
      expect(JSON.stringify(call)).not.toContain('Cloud history')
    const count = calls.length
    await act(async () => {
      state.newChat()
    })
    expect(calls).toHaveLength(count)
    view.unmount()
  })
  it('clears stale conversations on hydration failure and supports an explicit retry', async () => {
    controls.flag = true
    mswServer.use(
      http.get('https://assistant.example/v1/projects/:ref/conversations', () =>
        HttpResponse.json({ message: 'Unavailable' }, { status: 503 })
      )
    )
    const view = customRender(<Tree />, { queryClient: getQueryClient() })
    await waitFor(() => expect(state.initializationError).toBeDefined())
    expect(state.chats).toEqual({})
    expect(state.isInitialized).toBe(false)
    mswServer.use(
      http.get('https://assistant.example/v1/projects/:ref/conversations', () =>
        HttpResponse.json({ conversations: [row] })
      )
    )
    await act(async () => {
      state.reload()
    })
    await waitFor(() => {
      expect(state.initializationError).toBeUndefined()
      expect(state.isInitialized).toBe(true)
    })
    expect(state.initializationError).toBeUndefined()
    expect(controls.put).not.toHaveBeenCalled()
    view.unmount()
  })
  it('reloads user/project scoped state and stops previous chat instances on account changes', async () => {
    controls.flag = true
    const view = customRender(<Tree />, { queryClient: getQueryClient() })
    await waitFor(() => expect(state.chatInstances[cloudId]).toBeDefined())
    const old = state.chatInstances[cloudId]
    const stop = vi.spyOn(old, 'stop')
    controls.userId = 'user-b'
    controls.project = 'project-b'
    view.rerender(<Tree />)
    await waitFor(() => expect(calls.some((url) => url.includes('project-b'))).toBe(true))
    expect(stop).toHaveBeenCalled()
    await waitFor(() => expect(state.chatInstances[cloudId]).not.toBe(old))
    expect(controls.put).not.toHaveBeenCalled()
    view.unmount()
  })
})
