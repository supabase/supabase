import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { platformComponents } from 'api-types'
import { FeatureFlagContext } from 'common'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LegacyLogsRewriteBanner } from './LegacyLogsRewriteBanner'
import { API_URL } from '@/lib/constants'
import { createMockOrganizationResponse } from '@/tests/helpers'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock, mswServer } from '@/tests/lib/msw'

type ProjectDetailResponse = platformComponents['schemas']['ProjectDetailResponse']

const PROJECT_MOCK: ProjectDetailResponse = {
  id: 1,
  ref: 'default',
  organization_id: 1,
  name: 'Test Project',
  status: 'ACTIVE_HEALTHY',
  cloud_provider: 'AWS',
  region: 'us-east-1',
  db_host: 'db.default.supabase.co',
  restUrl: 'https://default.supabase.co/rest/v1/',
  inserted_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  subscription_id: 'sub_123',
  is_branch_enabled: false,
  is_physical_backups_enabled: false,
  high_availability: false,
  integration_source: null,
  connectionString: 'postgresql://postgres@localhost:5432/postgres',
  is_hibernating: false,
}

const ORG_MOCK = createMockOrganizationResponse({ slug: 'test-org', name: 'Test Org' })

const LEGACY_SQL = 'select event_message from edge_logs limit 10'

const renderBanner = ({
  sql = LEGACY_SQL,
  isLogsSource = true,
  isOtelLogsEnabled = true,
  hidden = false,
  onProposal = vi.fn(),
}: {
  sql?: string
  isLogsSource?: boolean
  isOtelLogsEnabled?: boolean
  hidden?: boolean
  onProposal?: (proposal: { original: string; modified: string }) => void
} = {}) => {
  const utils = customRender(
    <FeatureFlagContext.Provider
      value={{ configcat: { otelLegacyLogs: isOtelLogsEnabled }, posthog: {}, hasLoaded: true }}
    >
      <LegacyLogsRewriteBanner
        isLogsSource={isLogsSource}
        sql={sql}
        readSql={() => sql}
        onProposal={onProposal}
        hidden={hidden}
      />
    </FeatureFlagContext.Provider>
  )
  return { ...utils, onProposal }
}

describe('LegacyLogsRewriteBanner', () => {
  beforeEach(() => {
    addAPIMock({ method: 'get', path: '/platform/projects/:ref', response: PROJECT_MOCK })
    addAPIMock({ method: 'get', path: '/platform/organizations', response: [ORG_MOCK] })
    addAPIMock({
      method: 'post',
      path: '/platform/projects/:ref/analytics/endpoints/logs.all.otel',
      response: () =>
        HttpResponse.json<platformComponents['schemas']['AnalyticsResponse']>({ result: [] }),
    })
  })

  it('offers a rewrite for legacy logs SQL when the source is logs and the flag is on', async () => {
    renderBanner()

    expect(
      await screen.findByText('Logs now run on a ClickHouse-backed engine')
    ).toBeInTheDocument()
  })

  it('stays hidden when the source is not logs', () => {
    renderBanner({ isLogsSource: false })

    expect(screen.queryByText('Logs now run on a ClickHouse-backed engine')).not.toBeInTheDocument()
  })

  it('stays hidden when the SQL does not look legacy', () => {
    renderBanner({ sql: 'select event_message from logs limit 10' })

    expect(screen.queryByText('Logs now run on a ClickHouse-backed engine')).not.toBeInTheDocument()
  })

  it('stays hidden when the ClickHouse logs flag is off', () => {
    renderBanner({ isOtelLogsEnabled: false })

    expect(screen.queryByText('Logs now run on a ClickHouse-backed engine')).not.toBeInTheDocument()
  })

  it('stays hidden when a caller suppresses it via `hidden`, even for legacy SQL', () => {
    renderBanner({ hidden: true })

    expect(screen.queryByText('Logs now run on a ClickHouse-backed engine')).not.toBeInTheDocument()
  })

  it('hands an accepted rewrite to the caller via onProposal', async () => {
    const rewritten = "select event_message from logs where source = 'edge_logs' limit 10"
    mswServer.use(
      http.post(`${API_URL}/ai/code/complete`, async () => HttpResponse.json(rewritten))
    )

    const { onProposal } = renderBanner()

    await userEvent.click(await screen.findByRole('button', { name: 'Rewrite with Assistant' }))

    await waitFor(() =>
      expect(onProposal).toHaveBeenCalledWith({ original: LEGACY_SQL, modified: rewritten })
    )
  })

  it('dismisses the offer', async () => {
    renderBanner()

    await userEvent.click(await screen.findByRole('button', { name: 'Dismiss' }))

    await waitFor(() =>
      expect(
        screen.queryByText('Logs now run on a ClickHouse-backed engine')
      ).not.toBeInTheDocument()
    )
  })

  it('reports when the assistant found nothing to rewrite', async () => {
    mswServer.use(
      http.post(`${API_URL}/ai/code/complete`, async () => HttpResponse.json(LEGACY_SQL))
    )

    renderBanner()

    await userEvent.click(await screen.findByRole('button', { name: 'Rewrite with Assistant' }))

    expect(await screen.findByText('No rewrite needed')).toBeInTheDocument()
  })
})
