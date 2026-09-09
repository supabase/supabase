import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { components, paths } from 'api-types'
import { HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SSLConfiguration } from './SSLConfiguration'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectSettingsResponse = components['schemas']['ProjectSettingsResponse']
type SslEnforcementResponse = components['schemas']['SslEnforcementResponse']
type JitAccessConfigResponse =
  paths['/v1/projects/{ref}/jit-access']['get']['responses'][200]['content']['application/json']

const { mockUseAsyncCheckPermissions, mockUseHighAvailability, mockUseSelectedProjectQuery } =
  vi.hoisted(() => ({
    mockUseAsyncCheckPermissions: vi.fn(),
    mockUseHighAvailability: vi.fn(),
    mockUseSelectedProjectQuery: vi.fn(),
  }))

vi.mock('@/hooks/misc/useCheckPermissions', () => ({
  useAsyncCheckPermissions: mockUseAsyncCheckPermissions,
}))

vi.mock('@/hooks/misc/useHighAvailability', () => ({
  useHighAvailability: mockUseHighAvailability,
}))

vi.mock('@/hooks/misc/useSelectedProject', () => ({
  useSelectedProjectQuery: mockUseSelectedProjectQuery,
}))

const HA_TOOLTIP = 'SSL is always enforced on High Availability projects'

function mockProjectSettings() {
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
}

function mockJitDbAccess() {
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/jit-access',
    response: () =>
      HttpResponse.json<JitAccessConfigResponse>({ state: 'disabled', appliedSuccessfully: true }),
  })
}

/** Registers the SSL enforcement GET and returns a counter of how often it was hit. */
function mockSSLEnforcement(config: SslEnforcementResponse) {
  const requests = { count: 0 }
  addAPIMock({
    method: 'get',
    path: '/v1/projects/:ref/ssl-enforcement',
    response: () => {
      requests.count += 1
      return HttpResponse.json<SslEnforcementResponse>(config)
    },
  })
  return requests
}

describe('SSLConfiguration', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseSelectedProjectQuery.mockReturnValue({ data: { id: 1, ref: 'default' } })
    mockUseAsyncCheckPermissions.mockReturnValue({ can: true })
    mockProjectSettings()
    mockJitDbAccess()
  })

  it('shows SSL enforcement as always on for High Availability projects', async () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: true, isPending: false })
    const sslEnforcementRequests = mockSSLEnforcement({
      appliedSuccessfully: true,
      currentConfig: { database: false },
    })

    customRender(<SSLConfiguration />)

    const sslSwitch = await screen.findByRole('switch')
    expect(sslSwitch).toBeChecked()
    expect(sslSwitch).toBeDisabled()
    // Nothing is loading for HA projects, so there is no announcement to make
    expect(screen.getByRole('status')).toBeEmptyDOMElement()

    // The tooltip trigger is the wrapper around the (disabled) switch
    await userEvent.hover(sslSwitch.parentElement!)
    expect((await screen.findAllByText(HA_TOOLTIP, {}, { timeout: 2000 })).length).toBeGreaterThan(
      0
    )

    expect(sslEnforcementRequests.count).toBe(0)
  })

  it('does not open the confirm dialog around a disabled switch on High Availability projects', async () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: true, isPending: false })
    mockSSLEnforcement({ appliedSuccessfully: true, currentConfig: { database: false } })

    customRender(<SSLConfiguration />)

    const sslSwitch = await screen.findByRole('switch')
    // Clicking the disabled switch and the row wrapper around it must not open the dialog
    await userEvent.click(sslSwitch)
    await userEvent.click(sslSwitch.parentElement!.parentElement!)

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('reflects the fetched SSL enforcement config for other projects', async () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: false })
    const sslEnforcementRequests = mockSSLEnforcement({
      appliedSuccessfully: true,
      currentConfig: { database: false },
    })

    customRender(<SSLConfiguration />)

    const sslSwitch = await screen.findByRole('switch')
    expect(sslSwitch).not.toBeChecked()
    expect(sslSwitch).toBeEnabled()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(sslEnforcementRequests.count).toBe(1)
  })

  it('opens the confirm dialog from the switch and leaves it unchanged on cancel', async () => {
    mockUseHighAvailability.mockReturnValue({ isHighAvailability: false, isPending: false })
    mockSSLEnforcement({ appliedSuccessfully: true, currentConfig: { database: false } })

    customRender(<SSLConfiguration />)

    const sslSwitch = await screen.findByRole('switch')
    await userEvent.click(sslSwitch)

    const dialog = await screen.findByRole('alertdialog')
    expect(dialog).toHaveTextContent('Updating SSL enforcement involves a brief downtime')
    expect(screen.getByRole('button', { name: 'Enable SSL' })).toBeInTheDocument()
    // Controlled switch must not flip while the dialog is open
    expect(sslSwitch).not.toBeChecked()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(sslSwitch).not.toBeChecked()
  })
})
