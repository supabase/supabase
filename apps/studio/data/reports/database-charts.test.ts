import { describe, expect, it } from 'vitest'

import { getReportAttributesV2 } from './database-charts'
import { Project } from '@/data/projects/project-detail-query'

const PROJECT: Project = {
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
  ref: 'project-ref',
  region: 'us-east-1',
  restUrl: 'https://project-ref.supabase.co',
  status: 'ACTIVE_HEALTHY',
  subscription_id: 'subscription-1',
  updated_at: '2026-01-01T00:00:00.000Z',
}

const ENTITLED_FEATURES = ['database']

const getDedicatedPoolerChart = (project: Project) => {
  const chart = getReportAttributesV2(ENTITLED_FEATURES, project).find(
    (attribute) => attribute.id === 'pgbouncer-connections'
  )
  if (!chart) throw new Error('Expected the dedicated pooler chart to exist')
  return chart
}

const getClientConnectionsAttribute = (chart: ReturnType<typeof getDedicatedPoolerChart>) => {
  const attribute = chart.attributes?.find(
    (attr) => attr !== false && attr.attribute === 'client_connections_pgbouncer'
  )
  if (!attribute) throw new Error('Expected the client connections attribute to exist')
  return attribute
}

describe('getReportAttributesV2 dedicated pooler chart', () => {
  it('uses PgBouncer copy and links to the docs for standard projects', () => {
    const chart = getDedicatedPoolerChart(PROJECT)
    const attribute = getClientConnectionsAttribute(chart)

    expect(chart.titleTooltip).toBeUndefined()
    expect(chart.docsUrl).toContain('/guides/platform/compute-and-disk#limits-and-constraints')
    expect(attribute).toMatchObject({ label: 'pgbouncer', tooltip: 'PgBouncer connections' })
  })

  it('uses multipooler copy and drops the docs link for High Availability projects', () => {
    const chart = getDedicatedPoolerChart({ ...PROJECT, high_availability: true })
    const attribute = getClientConnectionsAttribute(chart)

    expect(chart.docsUrl).toBeUndefined()
    expect(chart.titleTooltip).toContain('multipooler')
    expect(chart.titleTooltip).toContain('docs coming soon')
    expect(attribute).toMatchObject({ label: 'multipooler', tooltip: 'Multipooler connections' })
  })
})
