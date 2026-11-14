import type { Project } from '@/data/projects/project-detail-query'
import { getReportAttributesV2 } from '@/data/reports/database-charts'
import { createMockProject } from '@/tests/helpers'

const project: Project = {
  ...createMockProject({}),
  status: 'ACTIVE_HEALTHY',
  inserted_at: '2026-01-01T00:00:00Z',
  is_physical_backups_enabled: false,
  subscription_id: 'subscription-1',
  connectionString: '',
  db_host: '',
  dbVersion: 'supabase-postgres-15.1.0',
  high_availability: false,
  infra_compute_size: 'micro',
  integration_source: null,
  restUrl: '',
  updated_at: '2026-01-01T00:00:00Z',
}
const report = getReportAttributesV2(['database'], project).find(
  (chart) => chart.id === 'memory-commitment'
)

if (!report?.thresholdZones) throw new Error('Missing memory commitment thresholds')

export const memoryCommitmentThresholds = report.thresholdZones
