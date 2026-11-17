import { setTimeout } from 'node:timers/promises'

const required = (name) => {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is required`)
  return value
}

const logflareUrl = required('LOGFLARE_URL')
const token = required('LOGFLARE_PRIVATE_ACCESS_TOKEN')
const sources = {
  'cloudflare.logs.prod': 'edge_logs',
  'postgres.logs': 'postgres_logs',
  'gotrue.logs.prod': 'auth_logs',
  'realtime.logs.prod': 'realtime_logs',
  'postgREST.logs.prod': 'postgrest_logs',
  'storage.logs.prod.2': 'storage_logs',
  'deno-relay-logs': 'function_logs',
}

async function request(path, method = 'GET', body) {
  const response = await fetch(`${logflareUrl}/api${path}`, {
    method,
    headers: { 'x-api-key': token, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  })
  if (!response.ok) throw new Error(`${method} ${path} failed (${response.status})`)
  return response.status === 204 ? undefined : response.json()
}

// The health endpoint can become ready before the Supabase sources are seeded.
let seededSources
for (let attempt = 0; attempt < 60; attempt++) {
  const available = await request('/sources')
  if (Object.keys(sources).every((name) => available.some((source) => source.name === name))) {
    seededSources = available.filter((source) => source.name in sources)
    break
  }
  await setTimeout(1000)
}
if (!seededSources) throw new Error('Timed out waiting for Logflare Supabase sources')

const backendConfig = {
  name: 'supabase-clickhouse',
  type: 'clickhouse',
  config: {
    url: 'http://clickhouse:8123',
    port: 8123,
    database: required('CLICKHOUSE_DB'),
    username: required('CLICKHOUSE_USER'),
    password: required('CLICKHOUSE_PASSWORD'),
  },
}
const existingBackend = (await request('/backends')).find(({ name }) => name === backendConfig.name)
const backend = existingBackend
  ? await request(`/backends/${existingBackend.token}`, 'PUT', backendConfig)
  : await request('/backends', 'POST', backendConfig)

const connection = await request(`/backends/${backend.token}/test`, 'POST')
if (!connection['connected?']) throw new Error('Logflare cannot connect to ClickHouse')

for (const source of seededSources) {
  if (!source.backends.some(({ token }) => token === backend.token)) {
    await request(`/sources/${source.token}/backends/${backend.token}`, 'POST')
  }
}

// Logflare 1.50.15 provisions one OTEL logs table per ClickHouse backend.
if (!/^[0-9a-f-]{36}$/.test(backend.token)) throw new Error('Invalid backend token')
const table = `otel_logs_${backend.token.replaceAll('-', '_')}`
const sourceCases = Object.entries(sources)
  .map(([name, source]) => `WHEN '${name}' THEN '${source}'`)
  .join('\n      ')
const endpoint = {
  name: 'logs.all.otel',
  backend_id: backend.id,
  language: 'ch_sql',
  sandboxable: true,
  enable_auth: true,
  cache_duration_seconds: 0,
  query: `WITH logs AS (
    SELECT
      toString(id) AS id,
      timestamp,
      event_message,
      severity_text,
      trace_id,
      span_id,
      resource_attributes,
      scope_attributes,
      log_attributes,
      CASE source_name
        ${sourceCases}
        ELSE source_name
      END AS source
    FROM ${table}
    WHERE timestamp >= parseDateTime64BestEffort(@iso_timestamp_start)
      AND timestamp <= parseDateTime64BestEffort(@iso_timestamp_end)
  )
  SELECT timestamp, id, event_message, source FROM logs LIMIT 100`,
}
const existingEndpoint = (await request('/endpoints')).find(({ name }) => name === endpoint.name)
if (existingEndpoint) {
  await request(`/endpoints/${existingEndpoint.token}`, 'PUT', endpoint)
} else {
  await request('/endpoints', 'POST', endpoint)
}
console.log('Unified Logs ClickHouse backend and endpoint are ready')
