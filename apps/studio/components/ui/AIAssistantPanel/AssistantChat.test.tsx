import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AssistantChat } from './AssistantChat'
import { aiKeys } from '@/data/ai/keys'
import { configKeys } from '@/data/config/keys'
import { organizationKeys } from '@/data/organizations/keys'
import { permissionKeys } from '@/data/permissions/keys'
import { projectKeys } from '@/data/projects/keys'
import { getQueryClient } from '@/data/query-client'
import { subscriptionKeys } from '@/data/subscriptions/keys'
import { AiAssistantStateContext, createAiAssistantState } from '@/state/ai-assistant-state'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

const controls = vi.hoisted(() => ({ flag: true }))
vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  useFlag: (name: string) => name === 'assistantSupabaseBackend' && controls.flag,
  useIsLoggedIn: () => true,
  useParams: () => ({ ref: 'default' }),
}))
vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))
vi.mock('@/lib/assistant/client', () => ({
  getAssistantRequestHeaders: async () => ({ Authorization: 'Bearer assistant' }),
}))
vi.mock('@/state/shortcuts/useShortcut', () => ({ useShortcut: () => {} }))
vi.mock('./AIOnboarding', () => ({ AIOnboarding: () => null }))

beforeEach(() => {
  controls.flag = true
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_SUPABASE_URL', 'https://assistant.example')
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_PUBLISHABLE_KEY', 'key')
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_API_URL', 'https://assistant.example')
  const client = getQueryClient()
  client.clear()
  client.setDefaultOptions({ queries: { retry: false, staleTime: Infinity } })
  client.setQueryData(aiKeys.apiKey(), { hasKey: false })
  client.setQueryData(permissionKeys.list(), [])
  client.setQueryData(projectKeys.detail('default'), { ref: 'default', organization_id: 1 })
  client.setQueryData(organizationKeys.list(), [{ id: 1, slug: 'org', opt_in_tags: [] }])
  client.setQueryData(configKeys.settingsV2('default'), { status: 'INACTIVE', is_sensitive: false })
  client.setQueryData(subscriptionKeys.orgSubscription('org'), { addons: [] })
  mswServer.use(
    http.get('https://assistant.example/v1/projects/default/permissions', () =>
      HttpResponse.json({
        selection: 'general',
        hasConsented: true,
        consentVersion: 1,
        options: [
          { value: 'general', label: 'General', description: 'General help', disabled: false },
        ],
        capabilities: { includeContext: false },
      })
    )
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  getQueryClient().clear()
})

function renderChat() {
  const state = createAiAssistantState()
  state.useAssistantBackend = controls.flag
  state.isInitialized = true
  state.context = { projectRef: 'default', orgSlug: 'org' }
  state.chats['chat'] = {
    id: 'chat',
    name: 'New chat',
    revision: 1,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  state.ensureChatInstance('chat')
  return customRender(
    <AiAssistantStateContext.Provider value={state}>
      <AssistantChat
        chatId="chat"
        onNewChat={() => {}}
        onSelectChat={() => {}}
        onBranchChat={() => {}}
        composerContext={{ initialInput: 'Hello' }}
      />
    </AiAssistantStateContext.Provider>,
    { queryClient: getQueryClient() }
  )
}

describe('Assistant model configuration', () => {
  it('allows a consented user to chat through the Worker when Studio has no model API key', async () => {
    renderChat()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Send message' })).toBeEnabled())
    expect(screen.queryByText('OpenAI API key not set')).not.toBeInTheDocument()
    expect(screen.getByRole('textbox')).toBeEnabled()
  })

  it('preserves the legacy API key requirement when the new backend flag is off', async () => {
    controls.flag = false
    renderChat()
    await screen.findByText('OpenAI API key not set')
    expect(screen.getByRole('textbox')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Send message' })).toBeDisabled()
  })
})
