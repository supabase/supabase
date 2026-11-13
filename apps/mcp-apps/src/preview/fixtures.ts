/**
 * surfaces-preview-fixture
 *
 * Development-only sample data implementing DataPort, so every surface can be
 * previewed without a host. The production build rejects any HTML containing
 * the marker above, so this module must only be imported from src/preview.
 */
import type { Bootstrap, Column, DataPort, PanelBootstrap, Row } from 'surfaces/contract'

const col = (name: string, format = 'text', extra: Partial<Column> = {}): Column => ({
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

const companies: Row[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    industry: 'Technology',
    city: 'San Francisco',
    employees: 240,
    active: true,
  },
  {
    id: '2',
    name: 'Northstar Labs',
    industry: 'Healthcare',
    city: 'Boston',
    employees: 85,
    active: true,
  },
  {
    id: '3',
    name: 'Meridian Studio',
    industry: 'Design',
    city: 'London',
    employees: 32,
    active: true,
  },
  {
    id: '4',
    name: 'Evergreen Foods',
    industry: 'Food & beverage',
    city: 'Portland',
    employees: 160,
    active: false,
  },
  {
    id: '5',
    name: 'Atlas Financial',
    industry: 'Finance',
    city: 'New York',
    employees: 420,
    active: true,
  },
  {
    id: '6',
    name: 'Lumen Energy',
    industry: 'Clean energy',
    city: 'Austin',
    employees: 95,
    active: true,
  },
  {
    id: '7',
    name: 'Coastal Supply',
    industry: 'Logistics',
    city: 'Brisbane',
    employees: 68,
    active: false,
  },
  {
    id: '8',
    name: 'Orbit Software',
    industry: 'Technology',
    city: 'Berlin',
    employees: 54,
    active: true,
  },
]

const definitions: Record<string, Column[]> = {
  companies: [
    col('id', 'int8', { generated: true, editable: false }),
    col('name'),
    col('industry'),
    col('city'),
    col('employees', 'int4'),
    col('active', 'bool'),
  ],
  contacts: [
    col('id', 'int8'),
    col('name'),
    col('email'),
    col('company_id', 'int8', { foreign_key: 'companies' }),
  ],
  deals: [
    col('id', 'int8'),
    col('name'),
    col('amount', 'numeric'),
    col('stage', 'text', { enums: ['Qualified', 'Proposal', 'Won'] }),
  ],
  activities: [col('id', 'int8'), col('summary')],
}

export const previewBootstrap: Bootstrap = {
  server: { name: 'supabase', version: 'surfaces-preview-fixture' },
  projects: [
    {
      id: 'sales-pipeline',
      name: 'Sales pipeline',
      status: 'ACTIVE_HEALTHY',
      region: 'us-east-1',
      organization_id: 'org-1',
      organization_slug: 'acme',
    },
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
  ],
  organizations: [
    { id: 'org-1', name: 'Acme', slug: 'acme' },
    { id: 'org-2', name: 'Personal', slug: 'personal' },
  ],
  regions: ['us-east-1', 'eu-west-1', 'ap-southeast-2'],
  capabilities: {
    readOnly: false,
    database: true,
    logs: true,
    logQueries: true,
    createProject: true,
    creationMode: 'legacy',
    scopedProjectId: null,
    openResource: true,
  },
}

const wait = () => new Promise((resolve) => setTimeout(resolve, 120))

function logRows(minutes: number): Row[] {
  const count = Math.min(60, Math.round(minutes / 2))
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 97_000).toISOString(),
    source: ['edge_logs', 'postgres_logs', 'auth_logs', 'function_logs'][i % 4],
    severity_text: i % 9 === 0 ? 'ERROR' : i % 7 === 0 ? 'WARN' : 'INFO',
    level: i % 9 === 0 ? 'error' : i % 7 === 0 ? 'warning' : 'info',
    status: i % 9 === 0 ? '500' : i % 4 === 0 ? '200' : '',
    method: i % 4 === 0 ? 'GET' : '',
    path: i % 4 === 0 ? '/rest/v1/companies' : '',
    event_message: [
      'GET /rest/v1/companies — request completed',
      'connection authorized: user=postgres database=postgres',
      'Login completed for authenticated user',
      'Worker finished processing scheduled task',
    ][i % 4],
  }))
}

export function createPreviewDataPort(): DataPort {
  const tables: Record<string, Row[]> = {
    companies: structuredClone(companies),
    contacts: [{ id: '1', name: 'Alex Morgan', email: 'alex@example.com', company_id: '1' }],
    deals: [{ id: '1', name: 'Enterprise plan', amount: '24000.00', stage: 'Proposal' }],
    activities: [],
  }
  const tableMeta = (name: string) => {
    if (!definitions[name]) throw new Error('Table is unavailable')
    return {
      schema: 'public',
      name,
      columns: definitions[name],
      primary_keys: ['id'],
      editable: true,
      rls_enabled: true,
      estimated_rows: tables[name].length,
    }
  }
  const findRow = (table: string, key: Row) => {
    const row = tables[table]?.find((r) => String(r.id) === String(key.id))
    if (!row) throw new Error('The row is no longer available. Find the row again.')
    return row
  }

  return {
    async getOrganization({ id }) {
      await wait()
      const organization = previewBootstrap.organizations.find((o) => o.slug === id || o.id === id)
      if (!organization) throw new Error('Organization not found in this preview.')
      return organization
    },
    async getProject({ id }) {
      await wait()
      const project = previewBootstrap.projects.find((p) => p.id === id)
      if (!project) throw new Error('Project not found in this preview.')
      return project
    },
    async bootstrap(input) {
      await wait()
      const data = structuredClone(previewBootstrap)
      if (input.project_ref) {
        data.projects = data.projects.filter((p) => p.id === input.project_ref)
        if (!data.projects.length) throw new Error('Project not found in this preview.')
        data.organizations = []
        data.capabilities.createProject = false
      } else if (input.organization_slug) {
        data.organizations = data.organizations.filter((o) => o.slug === input.organization_slug)
        if (!data.organizations.length) throw new Error('Organization not found in this preview.')
        data.projects = data.projects.filter((p) => p.organization_id === data.organizations[0].id)
      }
      data.discovery = {
        projectRef: input.project_ref ?? null,
        organizationSlug: input.organization_slug ?? null,
      }
      return data
    },
    async listNotebooks() {
      await wait()
      return {
        notebooks: [
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
          {
            id: 'nb-revenue',
            name: 'Revenue by plan',
            description: 'Monthly recurring revenue for each plan.',
            favorite: false,
            updated_at: '2026-10-28T12:00:00Z',
          },
        ],
      }
    },
    async getProjectOverview({ project_id }) {
      await wait()
      const hour = 3_600_000
      const end = Math.floor(Date.now() / hour) * hour
      const requestsByHour = [
        120, 98, 75, 92, 110, 165, 240, 320, 285, 350, 412, 390, 460, 520, 485, 610, 720, 680, 540,
        470, 395, 340, 280, 220,
      ]
      const points = requestsByHour.map((requests, i) => {
        const errors = i === 15 ? 18 : i % 4
        return {
          timestamp: end - (24 - i) * hour,
          requests,
          errorRate: (100 * errors) / requests,
          errors,
        }
      })
      const requests = points.reduce((sum, p) => sum + p.requests, 0)
      const errors = points.reduce((sum, p) => sum + p.errors, 0)
      return {
        projectId: project_id,
        observedAt: new Date().toISOString(),
        start: new Date(end - 24 * hour).toISOString(),
        end: new Date(end).toISOString(),
        traffic: {
          status: 'ready',
          data: {
            requests,
            responses: requests,
            errors,
            unknownStatus: 0,
            errorRate: (100 * errors) / requests,
            points: points.map(({ timestamp, requests, errorRate }) => ({
              timestamp,
              requests,
              errorRate,
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
    },
    async listSchemas() {
      await wait()
      return { schemas: [{ name: 'public' }, { name: 'auth' }, { name: 'storage' }] }
    },
    async listTables({ schemas: [schema] }) {
      await wait()
      if (schema !== 'public') return { tables: [] }
      return {
        tables: Object.entries(tables).map(([name, rows]) => ({
          name,
          rows: rows.length,
          rls_enabled: true,
        })),
      }
    },
    async readTable({ table, offset = 0, limit = 50, sort, filter }) {
      await wait()
      let rows = [...(tables[table] ?? [])]
      if (filter)
        rows = rows.filter((r) =>
          String(r[filter.column]).toLowerCase().includes(filter.value.toLowerCase())
        )
      if (sort)
        rows.sort(
          (a, b) =>
            String(a[sort.column]).localeCompare(String(b[sort.column])) *
            (sort.direction === 'desc' ? -1 : 1)
        )
      return {
        table: tableMeta(table),
        rows: rows.slice(offset, offset + limit),
        hasMore: rows.length > offset + limit,
      }
    },
    async readRow({ table, key }) {
      await wait()
      return { table: tableMeta(table), row: structuredClone(findRow(table, key)) }
    },
    async updateRow({ table, key, values, previous }) {
      await wait()
      const row = findRow(table, key)
      for (const [name, value] of Object.entries(previous))
        if (JSON.stringify(row[name]) !== JSON.stringify(value))
          throw new Error(
            'The row changed or is no longer available. Refresh before editing again.'
          )
      Object.assign(row, values)
      return { rows: [{ row: structuredClone(row) }] }
    },
    async insertRow({ table, values }) {
      await wait()
      const row = { id: String(tables[table].length + 1), ...values }
      tables[table].push(row)
      return { rows: [{ row: structuredClone(row) }] }
    },
    async getLogs({ minutes = 1440 }) {
      await wait()
      const end = new Date()
      return {
        rows: logRows(minutes),
        start: new Date(end.getTime() - minutes * 60_000).toISOString(),
        end: end.toISOString(),
      }
    },
    async executeSql({ query }) {
      await wait()
      const regclass = query.match(/to_regclass\(E'([^']+)'\)/)
      if (regclass) {
        const relation = regclass[1].replaceAll('"', '').replace(/^public\./, '')
        return tables[relation] ? [{ schema: 'public', name: relation }] : []
      }
      if (/count|group by/i.test(query))
        return ['Technology', 'Healthcare', 'Design', 'Finance'].map((industry, i) => ({
          industry,
          companies: [2, 1, 1, 1][i],
          employees: [294, 85, 32, 420][i],
        }))
      return structuredClone(tables.companies)
    },
    async queryLogs({ iso_timestamp_end }) {
      await wait()
      const end = Date.parse(iso_timestamp_end)
      return Array.from({ length: 12 }, (_, i) => ({
        timestamp: new Date(end - (12 - i) * 7_200_000).toISOString(),
        requests: 300 + ((i * 97) % 240),
        errors: (i * 7) % 11,
      }))
    },
  }
}

/** A sample launch for each focused surface. */
export const PREVIEW_PANELS = [
  'sql',
  'logs',
  'row',
  'block',
  'explorer',
  'home',
  'issues',
  'notebooks',
] as const
export type PreviewPanel = (typeof PREVIEW_PANELS)[number]

export function previewPanel(view: PreviewPanel): PanelBootstrap {
  const project_id = 'sales-pipeline'
  const sql =
    'select industry, count(*) as companies, sum(employees) as employees from companies group by industry order by companies desc;'
  const rows = [
    { industry: 'Technology', companies: 2, employees: 294 },
    { industry: 'Healthcare', companies: 1, employees: 85 },
    { industry: 'Design', companies: 1, employees: 32 },
    { industry: 'Finance', companies: 1, employees: 420 },
  ]
  const result = {
    rows,
    sql,
    hasMore: false as const,
    truncated: false,
    offset: 0 as const,
    limit: 1000,
  }
  if (view === 'home' || view === 'issues' || view === 'notebooks')
    return { ...previewBootstrap, panel: { id: `preview-${view}`, project_id, view } }
  if (view === 'explorer')
    return {
      ...previewBootstrap,
      panel: {
        id: 'preview-explorer',
        project_id,
        view: 'explorer',
        schema: 'public',
        table: 'companies',
      },
    }
  if (view === 'logs')
    return {
      ...previewBootstrap,
      panel: {
        id: 'preview-logs',
        project_id,
        view: 'logs',
        settings: { minutes: 60, search: '', source: 'all', level: 'all' },
      },
    }
  if (view === 'row')
    return {
      ...previewBootstrap,
      panel: {
        id: 'preview-row',
        project_id,
        view: 'row',
        table: {
          schema: 'public',
          name: 'companies',
          columns: definitions.companies,
          primary_keys: ['id'],
          editable: true,
          rls_enabled: true,
          estimated_rows: companies.length,
        },
        row: structuredClone(companies[0]),
      },
    }
  return {
    ...previewBootstrap,
    panel: {
      id: `preview-${view}`,
      project_id,
      view: 'query',
      source: 'database',
      title: 'Companies by industry',
      sql,
      result,
      ...(view === 'block'
        ? {
            surface: 'inline' as const,
            display: {
              view: 'chart' as const,
              chart: {
                type: 'bar' as const,
                x_column: 'industry',
                y_series: ['companies'],
                cumulative: false,
                scale: 'linear' as const,
                show_labels: true,
              },
            },
          }
        : {}),
    },
  }
}
