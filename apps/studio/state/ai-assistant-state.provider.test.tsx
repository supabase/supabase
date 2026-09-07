import { act, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useEffect } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  AiAssistantStateContextProvider,
  useAiAssistantState,
  type AiAssistantState,
} from './ai-assistant-state'
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
let state: AiAssistantState
let calls: string[]
function Probe() {
  const currentState = useAiAssistantState()
  state = currentState
  const projectRef = controls.project
  useEffect(() => {
    currentState.setContext({ projectRef, orgSlug: 'org' })
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
beforeEach(() => {
  controls.platform = true
  controls.flag = undefined
  controls.userId = 'user-a'
  controls.project = 'project-a'
  controls.stored = undefined
  controls.put.mockReset()
  controls.auth.mockReset().mockResolvedValue({
    Authorization: 'Bearer assistant',
    'x-platform-authorization': 'Bearer platform',
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
  getQueryClient().clear()
})
describe('assistant provider rollout containment', () => {
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
