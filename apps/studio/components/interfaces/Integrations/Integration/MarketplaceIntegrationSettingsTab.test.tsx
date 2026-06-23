import { fireEvent, screen, waitFor } from '@testing-library/react'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { MarketplaceIntegrationSettingsTab } from './MarketplaceIntegrationSettingsTab'
import { type IntegrationDefinition } from '@/components/interfaces/Integrations/Landing/Integrations.constants'
import { type components } from '@/data/api'
import { type APIKey } from '@/data/api-keys/api-keys-query'
import { type AuthConfigResponse } from '@/data/auth/auth-config-query'
import { type ProjectSecret } from '@/data/secrets/secrets-query'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// The OAuth-apps query overrides its return type to `AuthorizedApp`, but the wire response (and so
// the MSW resolver) is the raw OpenAPI `OAuthAppResponse`. Build fixtures against the API shape.
type OAuthAppResponse = components['schemas']['OAuthAppResponse']
type PartnerIntegrationListResponse = components['schemas']['PartnerIntegrationListResponse']

// `useIntegrationDetail` resolves the integration definition from the route, the marketplace query
// and feature flags — none of which is the subject of this test. Mock it so each test can drive a
// specific integration definition directly. `useSelectedOrganizationQuery` is a composite selector
// over the org list + slug param; mock it to a fixed org so the authorized-apps query can fire.
const { detail } = vi.hoisted(() => ({
  detail: { ref: 'default' as string | undefined, integration: undefined as unknown },
}))

vi.mock('@/components/interfaces/Integrations/Landing/useIntegrationDetail', () => ({
  useIntegrationDetail: () => detail,
}))
vi.mock('@/hooks/misc/useSelectedOrganization', () => ({
  useSelectedOrganizationQuery: () => ({ data: { slug: 'acme' } }),
}))
// The auth-config query (used to detect custom SMTP) only runs on the platform.
vi.mock('@/lib/constants', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()
  return { ...actual, IS_PLATFORM: true }
})

// The settings tab renders Radix-based modals (which rely on Web Animations).
mockAnimationsApi()

const setIntegration = (overrides: Partial<IntegrationDefinition> = {}) => {
  detail.integration = {
    id: 'custom',
    name: 'Custom Integration',
    type: 'oauth',
    ...overrides,
  } as IntegrationDefinition
}

const secretApiKey = (name: string): APIKey =>
  ({
    id: `key-${name}`,
    name,
    type: 'secret',
    prefix: 'sb_secret_',
    hash: 'hash',
    api_key: 'sb_secret_value',
    inserted_at: '2026-01-01T00:00:00Z',
    secret_jwt_template: { role: 'service_role' },
  }) as APIKey

const edgeSecret = (name: string): ProjectSecret =>
  ({ name, value: 'value', updated_at: '2026-01-01T00:00:00Z' }) as ProjectSecret

const authorizedApp = (appId: string): OAuthAppResponse => ({
  id: `app-${appId}`,
  app_id: appId,
  name: 'Test OAuth App',
  website: 'https://example.com',
  created_by: 'tester',
  authorized_at: '2026-01-01T00:00:00Z',
  registration_type: 'manual',
})

/**
 * Registers the five endpoints behind `useProjectOAuthIntegrationData`. Each test supplies only the
 * resources relevant to it; everything else defaults to "nothing connected".
 */
const mockProjectResources = ({
  apiKeys = [] as APIKey[],
  secrets = [] as ProjectSecret[],
  oauthApps = [] as OAuthAppResponse[],
  smtpHost = null as string | null,
} = {}) => {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/api-keys',
    response: () => HttpResponse.json<APIKey[]>(apiKeys),
  })
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/secrets',
    response: () => HttpResponse.json<ProjectSecret[]>(secrets),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/auth/:ref/config',
    response: () =>
      HttpResponse.json<AuthConfigResponse>({
        SMTP_HOST: smtpHost,
      } as unknown as AuthConfigResponse),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/integrations/partners/:ref',
    response: () => HttpResponse.json<PartnerIntegrationListResponse>({ integrations: [] }),
  })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations/:slug/oauth/apps',
    response: () => HttpResponse.json<OAuthAppResponse[]>(oauthApps),
  })
}

describe('MarketplaceIntegrationSettingsTab', () => {
  describe('section visibility follows the integration definition', () => {
    test('renders the secret API key section when the integration declares a secret key prefix', async () => {
      setIntegration({ secretKeyPrefix: 'custom_' })
      mockProjectResources({ apiKeys: [secretApiKey('custom_metrics_key')] })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(await screen.findByRole('heading', { name: 'Secret API key' })).toBeInTheDocument()
      expect(screen.getByText('custom_metrics_key')).toBeInTheDocument()
    })

    test('does not render a secret API key section when the integration declares no prefix, even if secret keys exist', async () => {
      setIntegration()
      mockProjectResources({ apiKeys: [secretApiKey('custom_metrics_key')] })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(await screen.findByText('No connected resources')).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'Secret API key' })).not.toBeInTheDocument()
      expect(screen.queryByText('custom_metrics_key')).not.toBeInTheDocument()
    })

    test('renders the Edge Function secret section only for integrations that declare a secret name', async () => {
      setIntegration({ id: 'doppler', name: 'Doppler' })
      mockProjectResources({ secrets: [edgeSecret('DOPPLER_CONFIG'), edgeSecret('UNRELATED')] })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(
        await screen.findByRole('heading', { name: 'Edge Function secret' })
      ).toBeInTheDocument()
      expect(screen.getByText('DOPPLER_CONFIG')).toBeInTheDocument()
      // Only the integration's own secret is shown, not unrelated project secrets.
      expect(screen.queryByText('UNRELATED')).not.toBeInTheDocument()
    })

    test('renders the SMTP section only for SMTP-configured integrations', async () => {
      setIntegration({ id: 'resend', name: 'Resend' })
      mockProjectResources({ smtpHost: 'smtp.resend.com' })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(await screen.findByRole('heading', { name: 'SMTP settings' })).toBeInTheDocument()
      expect(screen.getByText('smtp.resend.com')).toBeInTheDocument()
    })

    test('does not render an SMTP section for non-SMTP integrations even when the project uses the Resend host', async () => {
      setIntegration({ secretKeyPrefix: 'custom_' })
      mockProjectResources({
        apiKeys: [secretApiKey('custom_key')],
        smtpHost: 'smtp.resend.com',
      })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(await screen.findByRole('heading', { name: 'Secret API key' })).toBeInTheDocument()
      expect(screen.queryByRole('heading', { name: 'SMTP settings' })).not.toBeInTheDocument()
    })

    test('shows the empty state when the integration provisions nothing', async () => {
      setIntegration()
      mockProjectResources()

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(await screen.findByText('No connected resources')).toBeInTheDocument()
      expect(
        screen.getByText("Custom Integration doesn't have any resources connected to your project.")
      ).toBeInTheDocument()
    })
  })

  describe('resource section states', () => {
    test('a present resource shows the Connected badge and a Remove action', async () => {
      setIntegration({ secretKeyPrefix: 'custom_' })
      mockProjectResources({ apiKeys: [secretApiKey('custom_key')] })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(await screen.findByText('custom_key')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
    })

    test('uses the generic removal warning when the integration has no override copy', async () => {
      setIntegration({ secretKeyPrefix: 'custom_' })
      mockProjectResources({ apiKeys: [secretApiKey('custom_key')] })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(
        await screen.findByText(
          'Removing this key takes effect immediately and can interrupt the integration.'
        )
      ).toBeInTheDocument()
    })

    test('uses the integration-specific removal warning override when one is defined', async () => {
      setIntegration({ id: 'grafana', name: 'Grafana' })
      mockProjectResources({ apiKeys: [secretApiKey('grafana_cloud_integration_metrics')] })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(
        await screen.findByText(
          'Removing this key stops Grafana from collecting metrics from your project until a new key is connected.'
        )
      ).toBeInTheDocument()
      // The generic copy must not also be present.
      expect(
        screen.queryByText(
          'Removing this key takes effect immediately and can interrupt the integration.'
        )
      ).not.toBeInTheDocument()
    })

    test('an expected-but-absent resource renders a "Not connected" zero state with its absent note', async () => {
      // Grafana expects an OAuth app (present here) and an API key (absent), so the API key section
      // renders as a missing zero-state rather than being skipped.
      setIntegration({ id: 'grafana', name: 'Grafana', oauthAppId: 'grafana-app' })
      mockProjectResources({ oauthApps: [authorizedApp('grafana-app')] })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(await screen.findByText('Not connected')).toBeInTheDocument()
      expect(
        screen.getByText(
          'No secret API key is connected for Grafana to read your project metrics. Dashboards will not receive data without one.'
        )
      ).toBeInTheDocument()
    })

    test('shows the orphaned-resources warning and hides the OAuth section when the OAuth app is missing', async () => {
      setIntegration({ id: 'grafana', name: 'Grafana', oauthAppId: 'grafana-app' })
      mockProjectResources({ apiKeys: [secretApiKey('grafana_cloud_integration_metrics')] })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(await screen.findByText('OAuth application is missing')).toBeInTheDocument()
      // The OAuth app's own section is suppressed in favor of the banner, so its description is absent.
      expect(
        screen.queryByText(
          'Grants Grafana access to your organization so it can discover projects to monitor.'
        )
      ).not.toBeInTheDocument()
    })

    test('renders the OAuth section with a Connected badge when the OAuth app is present', async () => {
      setIntegration({ id: 'grafana', name: 'Grafana', oauthAppId: 'grafana-app' })
      mockProjectResources({
        oauthApps: [authorizedApp('grafana-app')],
        apiKeys: [secretApiKey('grafana_cloud_integration_metrics')],
      })

      customRender(<MarketplaceIntegrationSettingsTab />)

      expect(await screen.findByRole('heading', { name: 'OAuth application' })).toBeInTheDocument()
      expect(screen.getByText('Connected')).toBeInTheDocument()
      expect(
        screen.getByText(
          'Grants Grafana access to your organization so it can discover projects to monitor.'
        )
      ).toBeInTheDocument()
    })
  })

  describe('removing a resource', () => {
    test('deletes an Edge Function secret through the API and clears the section', async () => {
      setIntegration({ id: 'doppler', name: 'Doppler' })

      // Baseline: nothing else connected. The secrets endpoints below are registered afterwards so
      // MSW gives them priority, backing them with a stateful store the refetch can observe.
      mockProjectResources()

      let secrets: ProjectSecret[] = [edgeSecret('DOPPLER_CONFIG')]
      const deleteRequests: unknown[] = []

      addAPIMock({
        method: 'get',
        path: '/v1/projects/:ref/secrets',
        response: () => HttpResponse.json<ProjectSecret[]>(secrets),
      })
      addAPIMock({
        method: 'delete',
        path: '/v1/projects/:ref/secrets',
        response: async ({ request }) => {
          deleteRequests.push(await request.json())
          secrets = []
          // The bulk-delete endpoint replies 200 with no content.
          return HttpResponse.json([] as never)
        },
      })

      customRender(<MarketplaceIntegrationSettingsTab />)

      fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))
      // Confirm in the destructive ConfirmationModal.
      fireEvent.click(await screen.findByRole('button', { name: 'Remove' }))

      await waitFor(() => expect(deleteRequests).toEqual([['DOPPLER_CONFIG']]))
      await waitFor(() => expect(screen.getByText('No connected resources')).toBeInTheDocument())
    })
  })
})
