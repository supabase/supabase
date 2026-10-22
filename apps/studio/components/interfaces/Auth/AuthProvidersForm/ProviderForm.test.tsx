import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import type { components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { NuqsAdapter } from 'nuqs/adapters/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { PROVIDERS_SCHEMAS } from '../AuthProvidersFormValidation'
import type { Provider } from './AuthProvidersForm.types'
import { ProviderForm } from './ProviderForm'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']
type ProjectSettingsResponse = components['schemas']['ProjectSettingsResponse_Output']
type GoTrueConfigResponse = components['schemas']['GoTrueConfigResponse']

const emailProvider = PROVIDERS_SCHEMAS.find(
  (provider) => provider.title === 'Email'
) as unknown as Provider

const AUTH_PROVIDERS_PATH = '/project/default/auth/providers'

mockAnimationsApi()

function renderProviderForm() {
  return customRender(
    <NuqsAdapter>
      <ProviderForm
        config={{ HOOK_SEND_SMS_ENABLED: false } as GoTrueConfigResponse}
        provider={emailProvider}
        isActive={false}
      />
    </NuqsAdapter>
  )
}

async function openEmailProvider() {
  fireEvent.click(screen.getByRole('button', { name: /Email/ }))
  const dialog = await screen.findByRole('dialog', { name: 'Email' })
  await waitFor(() => expect(window.location.search).toBe('?provider=Email'))
  return dialog
}

async function traverseHistory(direction: 'back' | 'forward') {
  await act(async () => {
    await new Promise<void>((resolve) => {
      window.addEventListener('popstate', () => resolve(), { once: true })
      if (direction === 'back') window.history.back()
      else window.history.forward()
    })
  })
}

describe('ProviderForm URL history', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', AUTH_PROVIDERS_PATH)
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: () =>
        HttpResponse.json<ProjectDetailResponse>({
          id: 1,
          ref: 'default',
          name: 'Test project',
          organization_id: 1,
          status: 'ACTIVE_HEALTHY',
          cloud_provider: 'AWS',
          region: 'us-east-1',
          db_host: 'db.default.supabase.co',
          restUrl: 'https://default.supabase.co/rest/v1/',
          connectionString: null,
          inserted_at: '2026-01-01T00:00:00Z',
          updated_at: '2026-01-01T00:00:00Z',
          subscription_id: 'subscription',
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          high_availability: false,
          integration_source: null,
        }),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref/settings',
      response: () =>
        HttpResponse.json<ProjectSettingsResponse>({
          app_config: {
            db_schema: 'public',
            endpoint: 'default.supabase.co',
            storage_endpoint: 'storage.default.supabase.co',
          },
          cloud_provider: 'AWS',
          db_dns_name: 'default.supabase.co',
          db_host: 'default.supabase.co',
          db_ip_addr_config: 'ipv4',
          db_name: 'postgres',
          db_port: 5432,
          db_user: 'postgres',
          inserted_at: '2025-02-16T22:24:42.115195',
          name: 'default',
          ref: 'default',
          region: 'us-east-1',
          ssl_enforced: true,
          status: 'ACTIVE_HEALTHY',
        }),
    })
  })

  it('opens the email provider from a deep link', async () => {
    window.history.replaceState(null, '', `${AUTH_PROVIDERS_PATH}?provider=Email`)

    renderProviderForm()

    expect(await screen.findByRole('dialog', { name: 'Email' })).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Enable email provider' })).toBeInTheDocument()
  })

  it('pushes a history entry when the panel opens so Back closes it and Forward reopens it', async () => {
    const historyLength = window.history.length
    renderProviderForm()

    await openEmailProvider()
    await waitFor(() => expect(window.history.length).toBe(historyLength + 1))

    await traverseHistory('back')
    await waitFor(() => expect(window.location.search).toBe(''))
    expect(screen.queryByRole('dialog', { name: 'Email' })).not.toBeInTheDocument()

    await traverseHistory('forward')
    expect(await screen.findByRole('dialog', { name: 'Email' })).toBeInTheDocument()
    expect(window.location.search).toBe('?provider=Email')
  })

  it('pushes again when Cancel closes the panel so Back reopens it', async () => {
    renderProviderForm()
    const dialog = await openEmailProvider()
    const historyLength = window.history.length

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(window.location.search).toBe('')
      expect(window.history.length).toBe(historyLength + 1)
    })
    expect(screen.queryByRole('dialog', { name: 'Email' })).not.toBeInTheDocument()

    await traverseHistory('back')
    expect(await screen.findByRole('dialog', { name: 'Email' })).toBeInTheDocument()
    expect(window.location.search).toBe('?provider=Email')
  })
})
