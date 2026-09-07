import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AssistantProjectPermissions } from './AssistantProjectPermissions'
import { customRender } from '@/tests/lib/custom-render'
import { mswServer } from '@/tests/lib/msw'

vi.mock('@/lib/assistant/backend', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/assistant/backend')>()),
  useAssistantSupabaseBackend: () => true,
}))
vi.mock('@/lib/assistant/client', () => ({
  getAssistantRequestHeaders: async () => ({
    Authorization: 'Bearer assistant',
  }),
}))
vi.mock('@/state/ai-assistant-state', () => ({
  useAiAssistantStateSnapshot: () => ({ context: { projectRef: 'project', orgSlug: 'org' } }),
  useAiAssistantState: () => ({ reload: vi.fn() }),
}))
const url = 'https://assistant.example/v1/projects/project/permissions'
let writes: unknown[]
const permissions = {
  selection: 'general',
  hasConsented: false,
  capabilities: { includeContext: false },
  options: [
    { value: 'general', label: 'No project data', description: 'General help', disabled: false },
    { value: 'catalog', label: 'Schema', description: 'Catalog information', disabled: false },
    {
      value: 'diagnostics',
      label: 'Schema and logs',
      description: 'Project diagnostics',
      disabled: false,
    },
    { value: 'results', label: 'Query results', description: 'Approved results', disabled: false },
  ],
  consentVersion: 7,
}
function Dialog() {
  const [visible, setVisible] = useState(true)
  return <AssistantProjectPermissions visible={visible} onVisibleChange={setVisible} />
}
beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_ASSISTANT_API_URL', 'https://assistant.example')
  writes = []
  mswServer.use(
    http.get(url, () => HttpResponse.json(permissions)),
    http.post(url, async ({ request }) => {
      const body = await request.json()
      writes.push(body)
      return HttpResponse.json({ ...permissions, hasConsented: true })
    })
  )
})
afterEach(() => vi.unstubAllEnvs())
describe('integration project permissions', () => {
  it('renders Assistant-owned choices and submits opaque values with the service consent version', async () => {
    const user = userEvent.setup()
    customRender(<Dialog />)
    const save = await screen.findByRole('button', { name: 'Save permissions' })
    await waitFor(() => expect(save).toBeEnabled())
    expect(screen.getByRole('radio', { name: /No project data/ })).toBeChecked()
    await user.click(screen.getByRole('radio', { name: /^Schema and logs/ }))
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await waitFor(() =>
      expect(writes).toEqual([{ org_slug: 'org', selection: 'diagnostics', consentVersion: 7 }])
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    // Unhandled requests (including any legacy organization update) fail through MSW.
  })
  it('allows explicitly consenting to no project data', async () => {
    customRender(<Dialog />)
    const save = await screen.findByRole('button', { name: 'Save permissions' })
    await waitFor(() => expect(save).toBeEnabled())
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!)
    await waitFor(() => expect(writes).toEqual([expect.objectContaining({ selection: 'general' })]))
  })
  it('disables data-sharing choices when project policy prohibits them', async () => {
    mswServer.use(
      http.get(url, () =>
        HttpResponse.json({
          ...permissions,
          notice: 'Project restrictions currently prevent sharing project data.',
          options: permissions.options.map((option, index) => ({ ...option, disabled: index > 0 })),
        })
      )
    )
    customRender(<Dialog />)
    await screen.findByText('Project restrictions currently prevent sharing project data.')
    expect(screen.getByRole('radio', { name: /No project data/ })).toBeEnabled()
    for (const radio of screen.getAllByRole('radio').slice(1)) expect(radio).toBeDisabled()
  })
})
