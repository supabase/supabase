import type { NotebooksListProps, ProjectHomeProps, ProjectListProps } from 'surfaces/project'
import type { RowEditorProps } from 'surfaces/row'

/**
 * Sample data for the surfaces demos. Surfaces never fetch: a host loads data
 * and passes it in, so each demo hands a view one of these values.
 */

type Project = ProjectHomeProps['project']
type Overview = Extract<ProjectHomeProps['overview'], { status: 'success' }>['data']
type Table = RowEditorProps['table']
type Column = Table['columns'][number]
type Row = Record<string, unknown>

export const sampleProject: Project = {
  id: 'sales-pipeline',
  name: 'Sales pipeline',
  status: 'ACTIVE_HEALTHY',
  region: 'us-east-1',
  organization_id: 'org-1',
  organization_slug: 'acme',
}

export const sampleOrganizations: ProjectListProps['organizations'] = [
  { id: 'org-1', name: 'Acme', slug: 'acme' },
  { id: 'org-2', name: 'Personal', slug: 'personal' },
]

export const sampleProjects: Project[] = [
  sampleProject,
  {
    id: 'customer-portal',
    name: 'Customer portal',
    status: 'ACTIVE_HEALTHY',
    region: 'eu-west-1',
    organization_id: 'org-1',
    organization_slug: 'acme',
  },
  {
    id: 'internal-tools',
    name: 'Internal tools',
    status: 'INACTIVE',
    region: 'ap-southeast-2',
    organization_id: 'org-2',
    organization_slug: 'personal',
  },
]

export const sampleCapabilities: ProjectHomeProps['capabilities'] = {
  readOnly: false,
  database: true,
  logs: true,
  logQueries: true,
  createProject: true,
  creationMode: 'legacy',
  scopedProjectId: null,
  openResource: true,
}

export const sampleNotebooks: Extract<
  NotebooksListProps['notebooks'],
  { status: 'success' }
>['data'] = [
  {
    id: 'nb-signups',
    name: 'Weekly signups',
    description: 'New users per week, split by provider.',
    favorite: true,
    updated_at: '2026-11-10T09:00:00Z',
  },
  {
    id: 'nb-slow',
    name: 'Slow queries',
    description: null,
    favorite: false,
    updated_at: '2026-11-08T15:30:00Z',
  },
]

const column = (name: string, format = 'text', extra: Partial<Column> = {}): Column => ({
  name,
  format,
  data_type: format,
  nullable: false,
  default_value: null,
  enums: [],
  editable: true,
  generated: false,
  ...extra,
})

export const companiesTable: Table = {
  schema: 'public',
  name: 'companies',
  rls_enabled: true,
  estimated_rows: 6,
  primary_keys: ['id'],
  editable: true,
  columns: [
    column('id', 'int8', { generated: true, editable: false }),
    column('name'),
    column('industry', 'text', { enums: ['Technology', 'Healthcare', 'Design', 'Finance'] }),
    column('city', 'text', { nullable: true }),
    column('employees', 'int4'),
    column('active', 'bool'),
  ],
}

export const companies: Row[] = [
  {
    id: 1,
    name: 'Acme Corporation',
    industry: 'Technology',
    city: 'San Francisco',
    employees: 240,
    active: true,
  },
  {
    id: 2,
    name: 'Northstar Labs',
    industry: 'Healthcare',
    city: 'Boston',
    employees: 85,
    active: true,
  },
  {
    id: 3,
    name: 'Meridian Studio',
    industry: 'Design',
    city: 'London',
    employees: 32,
    active: true,
  },
  { id: 4, name: 'Atlas Financial', industry: 'Finance', city: null, employees: 420, active: true },
  {
    id: 5,
    name: 'Orbit Software',
    industry: 'Technology',
    city: 'Berlin',
    employees: 54,
    active: false,
  },
  {
    id: 6,
    name: 'Lumen Energy',
    industry: 'Technology',
    city: 'Austin',
    employees: 95,
    active: true,
  },
]

export const companiesByIndustrySql = `select industry, count(*) as companies, sum(employees) as employees
from companies
group by industry
order by companies desc;`

export const companiesByIndustry: Row[] = [
  { industry: 'Technology', companies: 3, employees: 389 },
  { industry: 'Healthcare', companies: 1, employees: 85 },
  { industry: 'Design', companies: 1, employees: 32 },
  { industry: 'Finance', companies: 1, employees: 420 },
]

const HOUR = 3_600_000
const lastHour = Math.floor(Date.now() / HOUR) * HOUR

const requestsByHour = [
  120, 98, 75, 92, 110, 165, 240, 320, 285, 350, 412, 390, 460, 520, 485, 610, 720, 680, 540, 470,
  395, 340, 280, 220,
]

/** Hourly API traffic for the last day, as a logs query returns it. */
export const hourlyTraffic: Row[] = requestsByHour.map((requests, i) => ({
  timestamp: new Date(lastHour - (24 - i) * HOUR).toISOString(),
  requests,
  errors: i === 15 ? 18 : i % 4,
}))

export const sampleOverview: Overview = (() => {
  const points = hourlyTraffic.map((point) => {
    const requests = point.requests as number
    const errors = point.errors as number
    return { timestamp: Date.parse(point.timestamp as string), requests, errors }
  })
  const requests = points.reduce((sum, point) => sum + point.requests, 0)
  const errors = points.reduce((sum, point) => sum + point.errors, 0)
  return {
    projectId: sampleProject.id,
    observedAt: new Date(lastHour).toISOString(),
    start: new Date(lastHour - 24 * HOUR).toISOString(),
    end: new Date(lastHour).toISOString(),
    traffic: {
      status: 'ready',
      data: {
        requests,
        responses: requests,
        errors,
        unknownStatus: 0,
        errorRate: (100 * errors) / requests,
        points: points.map(({ timestamp, requests, errors }) => ({
          timestamp,
          requests,
          errorRate: (100 * errors) / requests,
        })),
      },
    },
    security: {
      status: 'ready',
      data: {
        total: 2,
        truncated: false,
        issues: [
          {
            name: 'rls_disabled_in_public',
            title: 'Row level security disabled',
            level: 'ERROR',
            count: 2,
          },
        ],
      },
    },
    performance: {
      status: 'ready',
      data: {
        total: 1,
        truncated: false,
        issues: [
          {
            name: 'auth_rls_initplan',
            title: 'Auth checks run for every row',
            level: 'WARN',
            count: 1,
          },
        ],
      },
    },
    users: { status: 'ready', data: { total: 4663 } },
  }
})()

const logMessages = [
  'GET /rest/v1/companies request completed',
  'connection authorized: user=postgres database=postgres',
  'Login completed for authenticated user',
  'Worker finished processing scheduled task',
]

/** Recent project logs, newest first. */
export const sampleLogs: Row[] = Array.from({ length: 40 }, (_, i) => ({
  timestamp: new Date(lastHour - i * 97_000).toISOString(),
  source: ['edge_logs', 'postgres_logs', 'auth_logs', 'function_logs'][i % 4],
  severity_text: i % 9 === 0 ? 'ERROR' : i % 7 === 0 ? 'WARN' : 'INFO',
  level: i % 9 === 0 ? 'error' : i % 7 === 0 ? 'warning' : 'info',
  status: i % 9 === 0 ? '500' : i % 4 === 0 ? '200' : '',
  method: i % 4 === 0 ? 'GET' : '',
  path: i % 4 === 0 ? '/rest/v1/companies' : '',
  event_message: logMessages[i % 4],
}))

/** Resolves after a short delay, like a host round trip. */
export const roundTrip = <T>(value: T, ms = 600) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), ms))
