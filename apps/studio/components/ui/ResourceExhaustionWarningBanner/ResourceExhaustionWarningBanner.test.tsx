import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents as components } from 'api-types'
import { mockAnimationsApi } from 'jsdom-testing-mocks'
import { HttpResponse } from 'msw'
import { describe, expect, test, vi } from 'vitest'

import { ResourceExhaustionWarningBanner } from './ResourceExhaustionWarningBanner'
import type { ProfileContextType } from '@/lib/profile'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

type ProjectDetailResponse = components['schemas']['ProjectDetailResponse_Output']
type ProjectResourceWarningsResponse =
  components['schemas']['ProjectResourceWarningsResponse_Output']

const PROJECT_REF = 'project-ref'

const { trackSpy } = vi.hoisted(() => ({ trackSpy: vi.fn() }))

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('common')>()
  return {
    ...actual,
    IS_PLATFORM: true,
    useIsLoggedIn: () => true,
    useParams: () => ({ ref: PROJECT_REF }),
    useFlag: () => false,
  }
})

vi.mock('@/lib/telemetry/track', () => ({ useTrack: () => trackSpy }))

mockAnimationsApi()

const PROFILE_CONTEXT: ProfileContextType = {
  profile: {
    id: 1,
    auth0_id: 'auth0|test',
    gotrue_id: 'gotrue-test',
    username: 'testuser',
    primary_email: 'test@example.com',
    first_name: null,
    last_name: null,
    mobile: null,
    is_alpha_user: false,
    is_sso_user: false,
    disabled_features: [],
    free_project_limit: null,
  },
  error: null,
  isLoading: false,
  isError: false,
  isSuccess: true,
}

const PROJECT: ProjectDetailResponse = {
  cloud_provider: 'AWS',
  connectionString: 'postgresql://postgres:password@db.project-ref.supabase.co:5432/postgres',
  db_host: 'db.project-ref.supabase.co',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: false,
  id: 1,
  infra_compute_size: 'micro',
  inserted_at: '2026-01-01T00:00:00.000Z',
  integration_source: null,
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  name: 'Production',
  organization_id: 1,
  ref: PROJECT_REF,
  region: 'us-east-1',
  restUrl: `https://${PROJECT_REF}.supabase.co`,
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const NO_WARNINGS: ProjectResourceWarningsResponse = {
  project: PROJECT_REF,
  is_readonly_mode_enabled: false,
  auth_email_offender: null,
  auth_rate_limit_exhaustion: null,
  auth_restricted_email_sending: null,
  cpu_exhaustion: null,
  disk_io_exhaustion: null,
  disk_space_exhaustion: null,
  memory_and_swap_exhaustion: null,
  need_pitr: null,
}

const metricsHref = (chartId: string) =>
  `/project/${PROJECT_REF}/observability/database?chart=${chartId}&isHelper=true&helperText=Last+3+hours`

const renderBanner = (warnings: Partial<ProjectResourceWarningsResponse>) => {
  addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: PROJECT })
  addAPIMock({
    method: 'get',
    path: '/platform/organizations',
    response: [
      createMockOrganizationResponse({
        id: 1,
        slug: 'acme',
        plan: { id: 'pro', name: 'Pro' },
        usage_billing_enabled: true,
      }),
    ],
  })
  addAPIMock({
    method: 'get',
    path: '/platform/projects-resource-warnings',
    response: () =>
      HttpResponse.json<ProjectResourceWarningsResponse[]>([{ ...NO_WARNINGS, ...warnings }]),
  })

  return customRender(<ResourceExhaustionWarningBanner />, { profileContext: PROFILE_CONTEXT })
}

const openTroubleshootMenu = async () => {
  await userEvent.click(await screen.findByRole('button', { name: 'Troubleshoot' }))
  return within(await screen.findByRole('menu'))
}

describe('ResourceExhaustionWarningBanner', () => {
  test('multi-resource banner names each resource and links each to its chart', async () => {
    renderBanner({ cpu_exhaustion: 'warning', disk_space_exhaustion: 'warning' })

    expect(
      await screen.findByText(
        'Your project is exhausting CPU and Disk space, which is affecting its performance'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Check usage' })).toHaveAttribute(
      'href',
      `/project/${PROJECT_REF}/settings/infrastructure`
    )

    const menu = await openTroubleshootMenu()
    const itemLabels = menu.getAllByRole('menuitem').map((item) => item.textContent)
    expect(itemLabels).toEqual([
      'View CPU metrics',
      'View Disk space metrics',
      'CPU documentation',
      'Disk space documentation',
      'Ask AI Assistant',
    ])

    const cpuMetrics = menu.getByRole('menuitem', { name: 'View CPU metrics' })
    expect(cpuMetrics).toHaveAttribute('href', metricsHref('cpu-usage'))

    await userEvent.click(cpuMetrics)
    expect(trackSpy).toHaveBeenCalledWith('resource_exhaustion_banner_troubleshoot_clicked', {
      troubleshootAction: 'metrics',
      warningType: 'cpu_exhaustion',
      warningTypes: ['cpu_exhaustion', 'disk_space_exhaustion'],
      destination: metricsHref('cpu-usage'),
    })
  })

  test('single-resource banner keeps its title and adds View metrics', async () => {
    renderBanner({ cpu_exhaustion: 'warning' })

    expect(
      await screen.findByText(
        'Your project is currently facing high CPU usage, and its performance is affected'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Upgrade compute' })).toBeInTheDocument()

    const menu = await openTroubleshootMenu()
    const itemLabels = menu.getAllByRole('menuitem').map((item) => item.textContent)
    expect(itemLabels).toEqual(['View metrics', 'Documentation', 'Ask AI Assistant'])
    expect(menu.getByRole('menuitem', { name: 'View metrics' })).toHaveAttribute(
      'href',
      metricsHref('cpu-usage')
    )
  })

  test('all-compute multi banner keeps Upgrade compute and falls back to the throughput chart', async () => {
    renderBanner({ cpu_exhaustion: 'warning', disk_io_exhaustion: 'warning' })

    expect(await screen.findByRole('link', { name: 'Upgrade compute' })).toBeInTheDocument()

    const menu = await openTroubleshootMenu()
    expect(menu.getByRole('menuitem', { name: 'Ask AI Assistant' })).toBeInTheDocument()
    expect(menu.getByRole('menuitem', { name: 'View Disk IO metrics' })).toHaveAttribute(
      'href',
      metricsHref('disk-throughput')
    )
  })
})
