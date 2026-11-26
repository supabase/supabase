const projectRef = 'default'
const regions = [
  { cluster_id: '1', region_name: 'Singapore', region_code: 'ap-southeast-1' },
  { cluster_id: '2', region_name: 'Frankfurt', region_code: 'eu-central-1' },
  { cluster_id: '3', region_name: 'North Virginia', region_code: 'us-east-1' },
]
const names = [
  'Product analytics',
  'Customer events',
  'Finance reporting',
  'Inventory sync',
  'Support metrics',
  'Billing ledger',
  'Warehouse audit',
  'Marketing attribution',
]
const allPipelines = names.map((name, index) => ({
  id: `03h6pes1npx2ptvf052my5nx${index}`,
  cluster_id: String((index % 3) + 1),
  tenant_id: projectRef,
  source_id: 1,
  source_name: projectRef,
  destination_id: index + 1,
  destination_name: name,
  replicator_id: index + 1,
  config: { publication_name: ['analytics', 'events', 'reporting'][index % 3] },
}))
const statuses = [
  'started',
  'stopped',
  'failed',
  'starting',
  'started',
  'started',
  'stopped',
  'started',
]
const getDestinationConfig = (destinationId: number, scenario: string) => {
  if (scenario === 'busy') {
    if (destinationId === 5)
      return {
        snowflake: {
          account_id: 'PREVIEW-ANALYTICS',
          user: 'PIPELINES_USER',
          database: 'WAREHOUSE',
          schema: 'PUBLIC',
        },
      }
    if (destinationId === 6)
      return {
        ducklake: {
          catalog_url: 'postgres://preview.invalid/catalog',
          data_path: 's3://preview-lake/events/',
          metadata_schema: 'ducklake',
          s3_region: 'us-east-1',
        },
      }
    if (destinationId >= 7)
      return {
        clickhouse: {
          url: 'https://preview.clickhouse.example',
          user: 'default',
          database: 'operations',
        },
      }
  }
  return {
    big_query: {
      connection_pool_size: 8,
      dataset_id: 'analytics',
      project_id: 'preview-warehouse',
    },
  }
}

const getDestination = (pipeline: (typeof allPipelines)[number], scenario: string) => ({
  id: pipeline.destination_id,
  name: pipeline.destination_name,
  tenant_id: projectRef,
  config: getDestinationConfig(pipeline.destination_id, scenario),
})

export function getPipelinesMockResponse(
  request: Request,
  scenario = 'busy'
): Response | undefined {
  const counts: Record<string, number> = {
    one: 1,
    two: 2,
    small: 3,
    four: 4,
    uneven: 5,
    busy: 8,
  }
  const pipelines = allPipelines
    .slice(0, counts[scenario] ?? counts.busy)
    .map((pipeline) => (scenario === 'four' ? { ...pipeline, cluster_id: '1' } : pipeline))
  const url = new URL(request.url)
  const path = url.pathname.replace(/^\/api\/platform\//, '/')
  if (
    path !== '/replication/regions' &&
    !path.startsWith(`/replication/${projectRef}/`) &&
    path !== `/projects/${projectRef}` &&
    path !== `/projects/${projectRef}/run-lints` &&
    path !== '/organizations'
  )
    return

  if (request.method !== 'GET')
    return Response.json({ message: 'The local preview is read-only.' }, { status: 405 })
  if (path === '/replication/regions') return Response.json({ default_cluster_id: '1', regions })
  if (path === '/organizations' || path === `/projects/${projectRef}/run-lints`) {
    return Response.json([])
  }
  if (path === `/projects/${projectRef}`) {
    return Response.json({
      id: 1,
      ref: projectRef,
      name: 'Local pipeline fixtures',
      organization_id: 1,
      organization_slug: 'local',
      db_host: 'preview.invalid',
      restUrl: 'http://127.0.0.1:54321',
      connectionString: null,
      is_branch_enabled: false,
      is_physical_backups_enabled: false,
      cloud_provider: 'AWS',
      region: 'us-east-1',
      status: 'ACTIVE_HEALTHY',
      high_availability: false,
    })
  }

  const [resource, id, action] = path.replace(`/replication/${projectRef}/`, '').split('/')
  const cluster = url.searchParams.get('cluster_id') ?? '1'
  const selection = pipelines.filter((pipeline) => pipeline.cluster_id === cluster)
  if (resource === 'sources') {
    return Response.json({
      sources: [
        {
          id: 1,
          name: projectRef,
          tenant_id: projectRef,
          config: {
            host: 'preview.invalid',
            port: 5432,
            name: 'postgres',
            username: 'postgres',
          },
        },
      ],
    })
  }
  if (resource === 'destinations') {
    const destinations = selection.map((pipeline) => getDestination(pipeline, scenario))
    if (!id) return Response.json({ destinations })
    const destination = destinations.find((entry) => entry.id === Number(id))
    if (destination) return Response.json(destination)
  }
  if (resource === 'pipelines') {
    if (!id) return Response.json({ pipelines: selection })
    const pipeline = selection.find((entry) => entry.id === id)
    if (pipeline) {
      if (!action) return Response.json(pipeline)
      if (action === 'status')
        return Response.json({
          pipeline_id: id,
          status: { name: statuses[pipeline.destination_id - 1] },
        })
      if (action === 'version')
        return Response.json({
          pipeline_id: id,
          version: { id: 1, name: 'v0.2.0' },
        })
      if (action === 'replication-status') {
        return Response.json({
          pipeline_id: id,
          apply_lag: {
            confirmed_flush_lsn_bytes: pipeline.destination_id % 3 === 1 ? 0 : 4096,
          },
          table_statuses: ['orders', 'customers', 'events'].map((name, index) => ({
            id: index + 1,
            table_id: index + 1,
            name,
            table_name: `public.${name}`,
            schema: 'public',
            state: { name: index === 2 ? 'queued' : 'ready' },
          })),
        })
      }
    }
  }
  return Response.json({ message: 'No fixture for this request.' }, { status: 404 })
}
