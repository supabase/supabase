import type { Session } from '@supabase/supabase-js'
import { QueryClient } from '@tanstack/react-query'
import { act, screen, waitFor } from '@testing-library/react'
import { platformComponents as components } from 'api-types'
import { AuthContext, useFeatureFlags, useFlag } from 'common'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { StudioFeatureFlagProvider } from './StudioFeatureFlagProvider'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'
import { createMockProfileContext } from '@/tests/lib/profile-helpers'
import { routerMock } from '@/tests/lib/route-mock'

const { getFlags } = vi.hoisted(() => ({ getFlags: vi.fn() }))

vi.mock('common', async (importOriginal) => ({
  ...(await importOriginal<typeof import('common')>()),
  getFlags,
}))

vi.mock('@/lib/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/constants')>()),
  IS_PLATFORM: true,
}))

const SESSION: Session = {
  access_token: 'test-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: 'test-user',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-01-01T00:00:00Z',
    email: 'test@example.com',
  },
}

const PROFILE_CONTEXT = createMockProfileContext()

function FlagValue() {
  const isEnabled = useFlag('projectTargetedFeature')
  const { hasLoaded } = useFeatureFlags()
  return (
    <>
      <div>{isEnabled ? 'Enabled' : 'Disabled'}</div>
      <div>{hasLoaded ? 'Loaded' : 'Loading'}</div>
    </>
  )
}

function TestProvider() {
  return (
    <AuthContext.Provider
      value={{
        session: SESSION,
        error: null,
        isLoading: false,
        refreshSession: () => Promise.resolve(SESSION),
      }}
    >
      <StudioFeatureFlagProvider enabled>
        <FlagValue />
      </StudioFeatureFlagProvider>
    </AuthContext.Provider>
  )
}

describe('StudioFeatureFlagProvider', () => {
  beforeEach(() => {
    getFlags.mockReset()
    getFlags.mockImplementation(async (_userEmail, customAttributes) => [
      {
        settingKey: 'projectTargetedFeature',
        settingValue: customAttributes.project_ref === 'project-a',
      },
    ])
    routerMock.setCurrentUrl('/projects/project-a')

    addAPIMock({
      method: 'get',
      path: '/platform/organizations',
      response: () =>
        HttpResponse.json<components['schemas']['OrganizationResponse_Output'][]>([
          createMockOrganizationResponse({ slug: 'test-org', plan: { id: 'pro', name: 'Pro' } }),
        ]),
    })
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: ({ params }) =>
        HttpResponse.json<components['schemas']['ProjectDetailResponse_Output']>({
          id: 1,
          ref: String(params.ref),
          name: 'Test project',
          organization_id: 1,
          cloud_provider: 'AWS',
          region: 'us-east-1',
          inserted_at: '2026-01-01T00:00:00Z',
          subscription_id: 'subscription-1',
          status: 'ACTIVE_HEALTHY',
          is_branch_enabled: false,
          is_physical_backups_enabled: false,
          connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
          db_host: 'localhost',
          high_availability: false,
          integration_source: null,
          restUrl: 'https://example.supabase.co',
          updated_at: '2026-01-01T00:00:00Z',
        }),
    })
  })

  it('passes the project ref alongside existing email, cloud, and plan targeting', async () => {
    customRender(<TestProvider />, { profileContext: PROFILE_CONTEXT })

    expect(await screen.findByText('Enabled')).toBeInTheDocument()
    await waitFor(() => {
      expect(getFlags).toHaveBeenLastCalledWith(SESSION.user.email, {
        project_ref: 'project-a',
        cloud_provider: 'AWS',
        plan: 'pro',
      })
    })
  })

  it('re-evaluates on project switches and removes project targeting on organization pages', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    customRender(<TestProvider />, { profileContext: PROFILE_CONTEXT, queryClient })
    expect(await screen.findByText('Enabled')).toBeInTheDocument()

    await act(async () => routerMock.push('/projects/project-b'))
    expect(await screen.findByText('Disabled')).toBeInTheDocument()
    await waitFor(() => {
      expect(getFlags).toHaveBeenLastCalledWith(
        SESSION.user.email,
        expect.objectContaining({ project_ref: 'project-b' })
      )
    })

    await act(async () => routerMock.push('/organizations?slug=test-org'))
    await waitFor(() => {
      expect(getFlags).toHaveBeenLastCalledWith(SESSION.user.email, {
        cloud_provider: 'AWS',
        plan: 'pro',
      })
    })
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })

  it.each([
    { destination: '/projects/project-b', ref: 'project-b', scenario: 'switching projects' },
    { destination: '/organizations?slug=test-org', ref: undefined, scenario: 'leaving a project' },
  ])('hides the previous project flags while $scenario', async ({ destination, ref }) => {
    const pendingFlags =
      Promise.withResolvers<Array<{ settingKey: string; settingValue: boolean }>>()
    getFlags.mockImplementation((_email, attributes) =>
      attributes.project_ref === ref
        ? pendingFlags.promise
        : Promise.resolve([{ settingKey: 'projectTargetedFeature', settingValue: true }])
    )
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    customRender(<TestProvider />, { profileContext: PROFILE_CONTEXT, queryClient })
    expect(await screen.findByText('Enabled')).toBeInTheDocument()

    await act(async () => routerMock.push(destination))

    expect(screen.getByText('Disabled')).toBeInTheDocument()
    expect(screen.getByText('Loading')).toBeInTheDocument()

    await act(async () => {
      pendingFlags.resolve([{ settingKey: 'projectTargetedFeature', settingValue: false }])
    })
    expect(await screen.findByText('Loaded')).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })

  it('ignores a late evaluation after navigating to a different project', async () => {
    const pendingFlags =
      Promise.withResolvers<Array<{ settingKey: string; settingValue: boolean }>>()
    getFlags.mockImplementation((_email, attributes) =>
      attributes.project_ref === 'project-b'
        ? pendingFlags.promise
        : Promise.resolve([
            {
              settingKey: 'projectTargetedFeature',
              settingValue: attributes.project_ref === 'project-a',
            },
          ])
    )
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    customRender(<TestProvider />, { profileContext: PROFILE_CONTEXT, queryClient })
    expect(await screen.findByText('Enabled')).toBeInTheDocument()

    await act(async () => routerMock.push('/projects/project-b'))
    await act(async () => routerMock.push('/projects/project-c'))
    expect(await screen.findByText('Loaded')).toBeInTheDocument()
    expect(screen.getByText('Disabled')).toBeInTheDocument()

    await act(async () => {
      pendingFlags.resolve([{ settingKey: 'projectTargetedFeature', settingValue: true }])
    })
    expect(screen.getByText('Disabled')).toBeInTheDocument()
  })
})
