import { screen } from '@testing-library/react'
import type { components } from 'api-types'
import { HttpResponse } from 'msw'
import { useForm } from 'react-hook-form'
import { Form } from 'ui'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { type WebhookFormValues } from './EditHookPanel.constants'
import { HTTPHeaders } from './HTTPHeaders'
import { FGA_PERMISSIONS } from '@/hooks/misc/useCheckPermissionsV2'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { mockPermissionsError } from '@/tests/lib/msw-permissions'
import { ALL_FGA_PERMISSIONS, type PermissionsV2Response } from '@/tests/lib/permissions-fixtures'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { mockProjectGrantContext } from '@/tests/lib/project-grant-mocks'

type ApiKeyResponse = components['schemas']['ApiKeyResponse_Output']

vi.mock('common', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('common')
  return { ...actual, useIsLoggedIn: () => true, useParams: () => ({ ref: 'default' }) }
})

const requests = vi.fn()

const HTTPHeadersHarness = () => {
  const form = useForm<WebhookFormValues>({
    defaultValues: {
      name: 'test-hook',
      table_id: 'public.messages',
      http_method: 'POST',
      timeout_ms: 1000,
      events: ['INSERT'],
      function_type: 'supabase_function',
      http_url: 'https://default.supabase.co/functions/v1/hello',
      httpHeaders: [],
      httpParameters: [],
    },
  })

  return (
    <Form {...form}>
      <HTTPHeaders form={form} />
    </Form>
  )
}

const renderHeaders = () =>
  customRender(<HTTPHeadersHarness />, { profileContext: createMockProfileContext() })

const permissionsWithout = (...denied: string[]): PermissionsV2Response => ({
  organizations: [
    {
      slug: 'acme',
      role: 'developer',
      permissions: ALL_FGA_PERMISSIONS.filter((permission) => !denied.includes(permission)),
      projects: [],
    },
  ],
})

describe('HTTPHeaders API key access', () => {
  beforeEach(() => {
    requests.mockClear()
    addAPIMock({
      method: 'get',
      path: '/v1/projects/:ref/api-keys',
      response: ({ request }) => {
        requests(new URL(request.url).searchParams.get('reveal'))
        return HttpResponse.json<ApiKeyResponse[]>([])
      },
    })
  })

  it('requests revealed keys and shows no note when the user can read secrets', async () => {
    mockProjectGrantContext({ ref: 'default' })

    renderHeaders()

    await vi.waitFor(() => expect(requests).toHaveBeenCalledWith('true'))
    expect(screen.queryByText(/need additional permissions/)).not.toBeInTheDocument()
  })

  it('explains the placeholder and skips the request when secret keys are not readable', async () => {
    mockProjectGrantContext({
      ref: 'default',
      permissions: permissionsWithout(FGA_PERMISSIONS.PROJECT.API_GATEWAY_KEYS_SECRET_READ),
    })

    renderHeaders()

    expect(
      await screen.findByText(/You need additional permissions to view API keys\./)
    ).toBeVisible()
    expect(screen.getByRole('button', { name: 'Add header' })).toBeEnabled()
    expect(requests).not.toHaveBeenCalled()
  })

  it('shows an error when permissions fail to load', async () => {
    mockProjectGrantContext({ ref: 'default' })
    mockPermissionsError()

    renderHeaders()

    expect(await screen.findByText(/Failed to check API key permissions/)).toBeVisible()
  })
})
