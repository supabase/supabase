/**
 * The contract between Supabase surfaces and whatever serves them.
 *
 * Views define the data they need here: entity shapes, the data operations a
 * host provides (`DataPort`), what a connection allows (`Capabilities`), and
 * how each surface is presented (`surfaceResources`). A host implements it: an
 * MCP server registers tools and resources that match, Studio implements the
 * DataPort over its API client. The working MCP server version of this lives on
 * supabase/mcp `poc/surfaces`.
 *
 * Keep this module free of Node, React and host-specific code: it is bundled
 * into browser builds.
 */
import { z } from 'zod/v4'

// ==== display ====================================================================

/**
 * How a query result is presented. Wire names match Studio notebook cells
 * (apps/studio/data/content/notebooks/notebook-schema.ts) so a notebook's chart
 * settings can be handed to any surface unchanged.
 */
export const MAX_CHART_Y_SERIES = 3

export const chartConfigSchema = z
  .object({
    type: z.enum(['bar', 'line']).default('bar'),
    x_column: z.string().max(256),
    y_series: z
      .array(z.string().max(256))
      .max(MAX_CHART_Y_SERIES)
      .refine((values) => new Set(values).size === values.length, 'Choose distinct Y columns'),
    cumulative: z.boolean().default(false),
    scale: z.enum(['linear', 'log']).default('linear'),
    show_labels: z.boolean().default(false),
  })
  .strict()

export const queryDisplaySchema = z
  .object({
    view: z.enum(['table', 'chart']),
    chart: chartConfigSchema.optional(),
  })
  .strict()

export type ChartConfig = z.infer<typeof chartConfigSchema>
export type QueryDisplay = z.infer<typeof queryDisplaySchema>

export const DEFAULT_CHART: ChartConfig = {
  type: 'bar',
  x_column: '',
  y_series: [],
  cumulative: false,
  scale: 'linear',
  show_labels: false,
}

// ==== query-source ====================================================================

export const querySourceSchema = z.enum(['database', 'logs'])
export type QuerySource = z.infer<typeof querySourceSchema>

/** Logs queries are bounded to 24 hours, matching the analytics endpoint. */
export const MAX_LOG_WINDOW_MS = 86_400_000

export const querySourceFields = {
  source: querySourceSchema
    .default('database')
    .describe(
      'Use database for PostgreSQL or logs for the same read-only backend and dialect as query_logs. For error rates over time, aggregate logs into time buckets and render a line chart.'
    ),
  iso_timestamp_start: z.iso
    .datetime({ offset: true })
    .optional()
    .describe(
      'Logs only: start of the query window. Defaults to 24 hours before the end. Pass both timestamps for a requested time range; maximum 24 hours.'
    ),
  iso_timestamp_end: z.iso
    .datetime({ offset: true })
    .optional()
    .describe(
      'Logs only: end of the query window. Defaults to now. The resolved window is preserved when rerunning the block.'
    ),
}

export interface LogWindow {
  iso_timestamp_start: string
  iso_timestamp_end: string
}

export function resolveQueryWindow(
  args: {
    source?: QuerySource
    iso_timestamp_start?: string
    iso_timestamp_end?: string
  },
  now = Date.now()
): LogWindow | undefined {
  if (args.source !== 'logs') {
    if (args.iso_timestamp_start || args.iso_timestamp_end)
      throw new Error('Time windows are only supported for log queries.')
    return undefined
  }
  const end = args.iso_timestamp_end ? Date.parse(args.iso_timestamp_end) : now
  const start = args.iso_timestamp_start
    ? Date.parse(args.iso_timestamp_start)
    : end - MAX_LOG_WINDOW_MS
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start >= end ||
    end - start > MAX_LOG_WINDOW_MS
  )
    throw new Error('Choose a log window with a start before its end and no more than 24 hours.')
  return {
    iso_timestamp_start: new Date(start).toISOString(),
    iso_timestamp_end: new Date(end).toISOString(),
  }
}

export function validQueryWindow(args: Parameters<typeof resolveQueryWindow>[0]) {
  try {
    resolveQueryWindow(args)
    return true
  } catch {
    return false
  }
}

// ==== entities ====================================================================

export const rowSchema = z.record(z.string(), z.unknown())
export type Row = z.infer<typeof rowSchema>

export const projectSchema = z
  .object({
    id: z.string(),
    ref: z.string().optional(),
    name: z.string(),
    status: z.string(),
    region: z.string(),
    organization_id: z.string().optional(),
    organization_slug: z.string().optional(),
    /** ISO timestamp. Returned by get_project and create_project. */
    created_at: z.string().optional(),
  })
  .passthrough()
export type Project = z.infer<typeof projectSchema>

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
})
export type Organization = z.infer<typeof organizationSchema>

export const columnSchema = z.object({
  name: z.string(),
  data_type: z.string(),
  format: z.string(),
  nullable: z.boolean(),
  default_value: z.unknown().optional(),
  enums: z.array(z.string()),
  editable: z.boolean(),
  generated: z.boolean(),
  identity: z.boolean().optional(),
  foreign_key: z.string().optional(),
})
export type Column = z.infer<typeof columnSchema>

export const tableSchema = z.object({
  schema: z.string().min(1),
  name: z.string().min(1),
  rls_enabled: z.boolean(),
  estimated_rows: z.number(),
  primary_keys: z.array(z.string().min(1)),
  editable: z.boolean(),
  columns: z.array(columnSchema),
})
export type Table = z.infer<typeof tableSchema>

export const tableSummarySchema = z.object({
  name: z.string(),
  rows: z.number().nullable(),
  rls_enabled: z.boolean(),
})
export type TableSummary = z.infer<typeof tableSummarySchema>

/** What a connection allows. Surfaces hide actions; the server still enforces. */
export const capabilitiesSchema = z.object({
  readOnly: z.boolean(),
  /** Tables, rows and database SQL. */
  database: z.boolean(),
  /** The logs view: recent events with source and level filters. */
  logs: z.boolean().optional(),
  /** Logs SQL (`source=logs`) in the query editor. Possible on servers whose log dialect the logs view does not support. */
  logQueries: z.boolean().optional(),
  createProject: z.boolean(),
  creationMode: z.enum(['legacy', 'elicitation']),
  scopedProjectId: z.string().nullable(),
  /** Open a project or organization by reference, for tokens that cannot list the account. */
  openResource: z.boolean().optional(),
})
export type Capabilities = z.infer<typeof capabilitiesSchema>

export const serverDetailsSchema = z.object({
  name: z.string(),
  version: z.string(),
  appLinkBase: z.string().optional(),
})
export type ServerDetails = z.infer<typeof serverDetailsSchema>

/** The first payload every surface receives: who/what this connection can see. */
export const bootstrapSchema = z.object({
  server: serverDetailsSchema.optional(),
  projects: z.array(projectSchema),
  organizations: z.array(organizationSchema),
  regions: z.array(z.string()),
  notices: z.array(z.string()).optional(),
  discovery: z
    .object({
      projectRef: z.string().nullable(),
      organizationSlug: z.string().nullable(),
    })
    .optional(),
  capabilities: capabilitiesSchema,
})
export type Bootstrap = z.infer<typeof bootstrapSchema>

// ==== logs ====================================================================

export const logSourceSchema = z.enum([
  'all',
  'edge_functions',
  'edge_logs',
  'postgres_logs',
  'auth_logs',
  'storage_logs',
  'realtime_logs',
  'function_edge_logs',
  'function_logs',
  'postgrest_logs',
  'pgbouncer_logs',
])
export type LogSource = z.infer<typeof logSourceSchema>

export const logLevelSchema = z.enum(['all', 'error', 'warning', 'info'])
export type LogLevel = z.infer<typeof logLevelSchema>

export const LOG_WINDOW_MINUTES = [60, 360, 1440] as const
export const logMinutesSchema = z.union([z.literal(60), z.literal(360), z.literal(1440)])

export const logSettingsSchema = z.object({
  minutes: logMinutesSchema,
  search: z.string().max(500),
  source: logSourceSchema.optional(),
  level: logLevelSchema.optional(),
})
export type LogSettings = z.infer<typeof logSettingsSchema>

/** Display labels for unified log sources, matching Studio's unified logs. */
export const LOG_SOURCE_LABELS: Record<string, string> = {
  edge_logs: 'API Gateway',
  postgres_logs: 'Postgres',
  auth_logs: 'Auth',
  storage_logs: 'Storage',
  realtime_logs: 'Realtime',
  function_edge_logs: 'Functions',
  function_logs: 'Function runtime',
  postgrest_logs: 'PostgREST',
  pgbouncer_logs: 'Pooler',
}

export const LOG_EVENT_LIMIT = 100

// ==== overview ====================================================================

const advisorIssueSchema = z.object({
  name: z.string(),
  title: z.string(),
  level: z.enum(['WARN', 'ERROR']),
  count: z.number().int().positive(),
})

const advisorsSchema = z.object({
  total: z.number().nonnegative(),
  issues: z.array(advisorIssueSchema),
  truncated: z.boolean(),
})

/** A section that failed to load is explicit, never a zero or a healthy reading. */
const section = <T extends z.ZodType>(data: T) =>
  z.discriminatedUnion('status', [
    z.object({ status: z.literal('ready'), data }),
    z.object({ status: z.literal('unavailable'), message: z.string() }),
  ])

export const trafficSchema = z.object({
  requests: z.number().nonnegative(),
  responses: z.number().nonnegative(),
  errors: z.number().nonnegative(),
  unknownStatus: z.number().nonnegative(),
  errorRate: z.number().min(0).max(100).nullable(),
  points: z.array(
    z.object({
      timestamp: z.number(),
      requests: z.number().nonnegative(),
      errorRate: z.number().min(0).max(100).nullable(),
    })
  ),
})

export const projectOverviewSchema = z.object({
  projectId: z.string(),
  observedAt: z.string(),
  start: z.string(),
  end: z.string(),
  traffic: section(trafficSchema),
  security: section(advisorsSchema),
  performance: section(advisorsSchema),
  /** Total Auth users. Optional so views keep working with servers that predate it. */
  users: section(z.object({ total: z.number().int().nonnegative() })).optional(),
})

export type AdvisorIssue = z.infer<typeof advisorIssueSchema>
export type Advisors = z.infer<typeof advisorsSchema>
export type Traffic = z.infer<typeof trafficSchema>
export type ProjectOverview = z.infer<typeof projectOverviewSchema>

// ==== panel ====================================================================

/**
 * Launch payloads for focused surfaces (conversation panels and inline blocks).
 * They travel in result `_meta[PANEL_META_KEY]` so row contents stay out of
 * model-visible tool output.
 */
export const PANEL_META_KEY = 'supabase/panel'

const target = { id: z.string().min(1), project_id: z.string().min(1) }

export const QUERY_RESULT_ROW_LIMIT = 1000

export const queryResultPayloadSchema = z.object({
  rows: z.array(rowSchema).max(QUERY_RESULT_ROW_LIMIT),
  sql: z.string(),
  hasMore: z.literal(false),
  truncated: z.boolean(),
  offset: z.literal(0),
  limit: z.number().int().positive(),
})

export const rowPanelSchema = z
  .object({
    ...target,
    view: z.literal('row'),
    table: tableSchema.extend({
      primary_keys: z.array(z.string().min(1)).min(1),
    }),
    row: rowSchema,
  })
  .refine(
    (value) =>
      value.table.primary_keys.every(
        (key) =>
          Object.hasOwn(value.row, key) &&
          value.row[key] != null &&
          value.table.columns.some((column) => column.name === key)
      ) && value.table.columns.every((column) => Object.hasOwn(value.row, column.name)),
    'Row panels require a complete row and primary key'
  )

export const logsPanelSchema = z.object({
  ...target,
  view: z.literal('logs'),
  settings: logSettingsSchema,
})

/** A project's home: traffic, issues, users and checks the user can send to the agent. */
export const homePanelSchema = z.object({
  ...target,
  view: z.literal('home'),
})

/** A project's saved notebooks the agent can run. */
export const notebooksPanelSchema = z.object({
  ...target,
  view: z.literal('notebooks'),
})

/** A project's open issues from its security and performance advisors. */
export const issuesPanelSchema = z.object({
  ...target,
  view: z.literal('issues'),
})

/** Browse a project's tables and write SQL, optionally starting at a table. */
export const explorerPanelSchema = z.object({
  ...target,
  view: z.literal('explorer'),
  schema: z.string().min(1).max(256).optional(),
  table: z.string().min(1).max(256).optional(),
})

export const queryPanelSchema = z
  .object({
    ...target,
    view: z.literal('query'),
    ...querySourceFields,
    source: querySourceSchema.optional(),
    surface: z.literal('inline').optional(),
    display: queryDisplaySchema.optional(),
    title: z.string().min(1).max(100),
    sql: z.string().min(1).max(16000),
    result: queryResultPayloadSchema,
  })
  .refine(validQueryWindow, 'Invalid query source or log time window')
  .refine((value) => value.sql === value.result.sql, 'Query results must match their SQL')

export const panelLaunchSchema = z.discriminatedUnion('view', [
  rowPanelSchema,
  logsPanelSchema,
  queryPanelSchema,
  explorerPanelSchema,
  homePanelSchema,
  issuesPanelSchema,
  notebooksPanelSchema,
])
export type PanelLaunch = z.infer<typeof panelLaunchSchema>
export type QueryPanel = z.infer<typeof queryPanelSchema>
export type LogsPanel = z.infer<typeof logsPanelSchema>
export type RowPanel = z.infer<typeof rowPanelSchema>
export type ExplorerPanel = z.infer<typeof explorerPanelSchema>
export type HomePanel = z.infer<typeof homePanelSchema>
export type IssuesPanel = z.infer<typeof issuesPanelSchema>
export type NotebooksPanel = z.infer<typeof notebooksPanelSchema>

/** What a focused surface receives: the connection bootstrap plus its launch. */
export const panelBootstrapSchema = bootstrapSchema.extend({
  panel: panelLaunchSchema.optional(),
})
export type PanelBootstrap = z.infer<typeof panelBootstrapSchema>

// ==== data-port ====================================================================
// ---------------------------------------------------------------------------
// Data port: the operations a surface can ask its host for.
//
// Each operation names the MCP tool that implements it and the schemas for its
// arguments and result. The Supabase MCP server registers its app tools from
// these definitions; the MCP Apps adapter calls them and parses results with the
// same schemas; Studio implements the same operations against its own API
// client. Renaming a tool or changing a shape here changes all three together.
// ---------------------------------------------------------------------------

const projectTarget = z.object({ project_id: z.string().trim().min(1).max(100) }).strict()
const tableTarget = z.object({
  project_id: z.string().min(1),
  schema: z.string().min(1),
  table: z.string().min(1),
})
const rowKey = rowSchema.describe(
  'The complete primary key of the row, including every column for composite keys. Pass bigint and numeric key values as strings to preserve precision.'
)
const mutationResultSchema = z.object({
  rows: z.array(z.object({ row: rowSchema })),
})

/** App-only tools are hidden from the model. Visibility is not authorization. */
export type DataOperationVisibility = 'app' | 'shared'

interface DataOperation<I extends z.ZodType, O extends z.ZodType> {
  tool: string
  visibility: DataOperationVisibility
  /** `rows`: a SQL tool whose rows the model sees wrapped as untrusted data; hosts unwrap them. */
  result?: 'rows'
  description: string
  input: I
  output: O
}
const operation = <I extends z.ZodType, O extends z.ZodType>(op: DataOperation<I, O>) => op

/** A saved notebook as a list shows it. Notebook names and descriptions are user content. */
export const notebookSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  favorite: z.boolean(),
  updated_at: z.string(),
})
export type NotebookSummary = z.infer<typeof notebookSummarySchema>

export const dataOperations = {
  /** Connection bootstrap. Also the global "Supabase" entrypoint. */
  bootstrap: operation({
    tool: 'open_projects',
    visibility: 'app',
    description: 'Open the Supabase project browser.',
    input: z
      .object({
        project_ref: z.string().trim().min(1).max(100).optional(),
        organization_slug: z.string().trim().min(1).max(100).optional(),
      })
      .refine((value) => !(value.project_ref && value.organization_slug), {
        message: 'Choose a project or an organization, not both',
      }),
    output: bootstrapSchema,
  }),
  /** The model's own `get_project`, for views that follow a project's status. */
  getProject: operation({
    tool: 'get_project',
    visibility: 'shared',
    description: 'Gets details for a Supabase project.',
    input: z.object({ id: z.string().min(1) }),
    output: projectSchema,
  }),
  /** The model's own `get_organization`, to name a project's organization. Takes the slug. */
  getOrganization: operation({
    tool: 'get_organization',
    visibility: 'shared',
    description: 'Gets details for an organization.',
    input: z.object({ id: z.string().min(1) }),
    output: z.object({ id: z.string(), name: z.string() }).passthrough(),
  }),
  /** The model's own `list_notebooks`; the view keeps only the fields it shows. */
  listNotebooks: operation({
    tool: 'list_notebooks',
    visibility: 'shared',
    description: "List a project's saved notebooks.",
    input: projectTarget,
    output: z.object({ notebooks: z.array(notebookSummarySchema) }),
  }),
  getProjectOverview: operation({
    tool: 'app_get_project_overview',
    visibility: 'app',
    description:
      'Read hourly API gateway request counts and HTTP error rates for the last 24 complete hours, warning/error security and performance advisors, and the total Auth user count for the project home. No polling.',
    input: projectTarget,
    output: projectOverviewSchema,
  }),
  listSchemas: operation({
    tool: 'app_list_schemas',
    visibility: 'app',
    description: 'List schemas for the project explorer.',
    input: z.object({ project_id: z.string().min(1) }),
    output: z.object({ schemas: z.array(z.object({ name: z.string() })) }),
  }),
  /** The model's own `list_tables` in its compact form. Names come back as `schema.table`. */
  listTables: operation({
    tool: 'list_tables',
    visibility: 'shared',
    description: 'List tables in the given schemas with row estimates.',
    input: z.object({
      project_id: z.string().min(1),
      schemas: z.array(z.string().min(1)).min(1),
    }),
    output: z.object({ tables: z.array(tableSummarySchema) }),
  }),
  readTable: operation({
    tool: 'app_read_table',
    visibility: 'app',
    description: 'Read a bounded page of table rows and column metadata for the table view.',
    input: tableTarget.extend({
      offset: z.number().int().min(0).max(10000).default(0),
      limit: z.number().int().min(1).max(200).default(50),
      sort: z.object({ column: z.string(), direction: z.enum(['asc', 'desc']) }).optional(),
      filter: z.object({ column: z.string(), value: z.string().max(1000) }).optional(),
    }),
    output: z.object({
      table: tableSchema,
      rows: z.array(rowSchema),
      hasMore: z.boolean(),
    }),
  }),
  readRow: operation({
    tool: 'app_read_row',
    visibility: 'app',
    description: 'Reload one row by its complete primary key for the row editor.',
    input: tableTarget.extend({ key: rowKey }).strict(),
    output: z.object({ table: tableSchema, row: rowSchema }),
  }),
  updateRow: operation({
    tool: 'app_update_row',
    visibility: 'app',
    description:
      'Atomically update fields in one row identified by its complete primary key; fail if any edited value changed.',
    input: tableTarget.extend({
      key: rowSchema,
      values: rowSchema,
      previous: rowSchema,
    }),
    output: mutationResultSchema,
  }),
  insertRow: operation({
    tool: 'app_insert_row',
    visibility: 'app',
    description: 'Insert one row, preserving database defaults for omitted columns.',
    input: tableTarget.extend({ values: rowSchema }),
    output: mutationResultSchema,
  }),
  getLogs: operation({
    tool: 'app_get_logs',
    visibility: 'app',
    description: `Read the latest ${LOG_EVENT_LIMIT} unified project logs in a bounded time window. No polling.`,
    input: z.object({
      project_id: z.string().min(1),
      minutes: z.number().int().min(1).max(1440).default(1440),
      source: logSourceSchema.default('all'),
      level: logLevelSchema.default('all'),
    }),
    output: z.object({
      rows: z.array(rowSchema),
      start: z.string(),
      end: z.string(),
    }),
  }),
  /**
   * Arbitrary SQL goes through the model-visible tools so their approval and
   * read-only policies apply. Results arrive wrapped for the model; adapters
   * unwrap them with `parseUntrustedRows`.
   */
  executeSql: operation({
    tool: 'execute_sql',
    visibility: 'shared',
    result: 'rows',
    description: 'Run SQL with the connection’s existing approval and read-only policy.',
    input: z.object({
      project_id: z.string().min(1),
      query: z.string().min(1),
    }),
    output: z.array(rowSchema),
  }),
  queryLogs: operation({
    tool: 'query_logs',
    visibility: 'shared',
    result: 'rows',
    description: 'Run a read-only logs query in an explicit window of at most 24 hours.',
    input: z.object({
      project_id: z.string().min(1),
      sql: z.string().min(1),
      iso_timestamp_start: z.string(),
      iso_timestamp_end: z.string(),
    }),
    output: z.array(rowSchema),
  }),
} as const

export type DataOperations = typeof dataOperations
export type DataOperationName = keyof DataOperations
export type DataInput<K extends DataOperationName> = z.input<DataOperations[K]['input']>
export type DataOutput<K extends DataOperationName> = z.output<DataOperations[K]['output']>

/** What every host implements: Studio over its API client, MCP Apps over tools. */
export type DataPort = {
  [K in DataOperationName]: (input: DataInput<K>) => Promise<DataOutput<K>>
}

/**
 * Shared model-visible tools wrap JSON results in an untrusted-data boundary.
 * Accept only a tag followed by JSON, using the final paired closing tag so
 * literal tags inside row strings remain data.
 */
export function parseUntrustedJson(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) return JSON.parse(trimmed)
  const match = text.match(/<(untrusted-data-[a-zA-Z0-9-]+)>\s*([\[{][\s\S]*)\s*<\/\1>/)
  return JSON.parse(match?.[2] ?? text)
}

/** Rows from analytics or SQL tools, which may nest results or report errors in a 200 body. */
export function parseUntrustedRows(value: unknown): Row[] {
  for (let depth = 0; depth < 5; depth++) {
    if (Array.isArray(value)) {
      if (value.some((row) => !row || typeof row !== 'object' || Array.isArray(row))) break
      return value as Row[]
    }
    if (typeof value === 'string') {
      value = parseUntrustedJson(value)
    } else if (value && typeof value === 'object') {
      if ('error' in value && value.error != null) {
        const error = value.error
        throw new Error(
          typeof error === 'string'
            ? error
            : error &&
                typeof error === 'object' &&
                'message' in error &&
                typeof error.message === 'string'
              ? error.message
              : 'The query failed.'
        )
      }
      if (!('result' in value)) break
      value = value.result
    } else break
  }
  throw new Error('The server returned an unsupported result.')
}

// ---------------------------------------------------------------------------
// Resources: one `ui://` document per surface.
//
// The server renders each document from `renderSurfaceDocument`. The surface
// build (apps/mcp-apps in the Supabase monorepo) publishes one script and one
// stylesheet per surface under a versioned path, e.g.
// `https://supabase.com/mcp-apps/v1/projects.js`. A document either links them
// from that origin (declared in the resource CSP) or carries them inline.
// ---------------------------------------------------------------------------

export const SURFACE_MIME_TYPE = 'text/html;profile=mcp-app'

/**
 * The version of every surface's contract: its resource URI (`ui://supabase/panel-v1`) and its
 * published asset path (`…/v1/panel.js`). Hosts cache resources by URI, and published tool
 * metadata points at URIs, so a change that older servers, hosts or surfaces would
 * misunderstand needs a new version. When bumping it, keep registering and publishing the
 * previous version for as long as published metadata may still reference it.
 */
export const SURFACE_VERSION = 'v1'

const surfaceUri = <N extends string>(name: N) =>
  `ui://supabase/${name}-${SURFACE_VERSION}` as const

export const surfaceResources = {
  projects: {
    uri: surfaceUri('projects'),
    name: 'Supabase Projects',
    description: 'Browse Supabase projects and work in a project workspace.',
    layout: 'fill',
    displayModes: ['fullscreen'],
    preferredDisplayMode: 'fullscreen',
  },
  panel: {
    uri: surfaceUri('panel'),
    name: 'Supabase Panel',
    description: 'A focused SQL, logs or row panel opened from the conversation.',
    layout: 'fill',
    displayModes: ['fullscreen'],
    preferredDisplayMode: 'fullscreen',
  },
  'query-block': {
    uri: surfaceUri('query-block'),
    name: 'Supabase Query Block',
    description: 'Query results shown inline in the conversation.',
    layout: 'inline',
    displayModes: ['inline', 'fullscreen'],
    preferredDisplayMode: 'inline',
  },
  /** Rendered from `create_project` results: the new project and its live status. */
  'project-card': {
    uri: surfaceUri('project-card'),
    name: 'Supabase Project Card',
    description: 'A project and its current status, shown inline in the conversation.',
    layout: 'inline',
    displayModes: ['inline'],
    preferredDisplayMode: 'inline',
  },
} as const
export type SurfaceName = keyof typeof surfaceResources
export const SURFACE_NAMES = Object.keys(surfaceResources) as SurfaceName[]

/** File names a surface build publishes for each surface. */
export function surfaceAssetFiles(surface: SurfaceName) {
  return { script: `${surface}.js`, style: `${surface}.css` }
}

export type SurfaceAsset = { url: string } | { inline: string }

/**
 * The HTML document for one surface. The surface mounts into `#root`; inline
 * surfaces size to their content instead of filling the frame.
 */
export function renderSurfaceDocument({
  surface,
  script,
  style,
}: {
  surface: SurfaceName
  script: SurfaceAsset
  style: SurfaceAsset
}) {
  const { layout } = surfaceResources[surface]
  const attribute = (value: string) =>
    value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
  const styleTag =
    'url' in style
      ? `<link rel="stylesheet" href="${attribute(style.url)}" />`
      : // `</style` inside the stylesheet would end the element early.
        `<style>${style.inline.replaceAll('</style', '<\\/style')}</style>`
  const scriptTag =
    'url' in script
      ? `<script type="module" src="${attribute(script.url)}"></script>`
      : `<script type="module">${script.inline.replaceAll('</script', '<\\/script')}</script>`
  return [
    '<!doctype html>',
    `<html lang="en" data-theme="dark" class="dark"${layout === 'inline' ? ' data-surface="inline"' : ''}>`,
    '<head>',
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<title>Supabase</title>',
    styleTag,
    '</head>',
    '<body>',
    '<div id="root"></div>',
    scriptTag,
    '</body>',
    '</html>',
  ].join('\n')
}

// ==== workspace tools ==========================================================
// Tools a mounted workspace registers with the host so the agent can drive it.
// They change what is on screen; they never execute SQL.

const workspaceProjectTarget = { project_id: z.string().min(1).max(100) }

export const workspaceToolInputs = {
  read_workspace: z.object({}).strict(),
  open_query: z
    .object({
      ...workspaceProjectTarget,
      title: z.string().trim().min(1).max(100),
      sql: z.string().trim().min(1).max(16000),
      ...querySourceFields,
      display: queryDisplaySchema.optional(),
    })
    .strict()
    .refine(validQueryWindow, 'Invalid query source or log time window'),
  set_query_draft: z
    .object({
      ...workspaceProjectTarget,
      tab_id: z.string().min(1),
      expected_revision: z.number().int().nonnegative(),
      sql: z.string().trim().min(1).max(16000),
    })
    .strict(),
  set_query_display: z
    .object({
      ...workspaceProjectTarget,
      tab_id: z.string().min(1),
      expected_display_revision: z.number().int().nonnegative(),
      display: queryDisplaySchema,
    })
    .strict(),
  open_table: z
    .object({
      ...workspaceProjectTarget,
      schema: z.string().min(1).max(256),
      table: z.string().min(1).max(256),
    })
    .strict(),
  configure_logs: z
    .object({
      ...workspaceProjectTarget,
      minutes: logMinutesSchema,
      search: z.string().max(500).default(''),
      source: logSourceSchema.optional(),
      level: logLevelSchema.optional(),
    })
    .strict(),
  refresh_view: z.object(workspaceProjectTarget).strict(),
} as const

export type WorkspaceToolName = keyof typeof workspaceToolInputs
export type WorkspaceToolInput<K extends WorkspaceToolName> = z.output<
  (typeof workspaceToolInputs)[K]
>
