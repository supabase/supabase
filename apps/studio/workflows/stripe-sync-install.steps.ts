import crypto from 'node:crypto'
import { FatalError } from 'workflow'
import {
  INSTALLATION_ERROR_SUFFIX,
  INSTALLATION_INSTALLED_SUFFIX,
  INSTALLATION_STARTED_SUFFIX,
  STRIPE_SCHEMA_COMMENT_PREFIX,
  webhookFunctionCode,
  workerFunctionCode,
} from 'stripe-experiment-sync/supabase'
import { VERSION } from 'stripe-experiment-sync'
import { StripeSync, runMigrations } from 'stripe-experiment-sync'
import postgres from 'postgres'

const DEFAULT_WORKER_INTERVAL_SECONDS = 60

export type StripeSyncInstallWorkflowInput = {
  supabaseAccessToken: string
  supabaseProjectRef: string
  stripeSecretKey: string
  packageVersion?: string
  workerIntervalSeconds?: number
  baseProjectUrl?: string
  supabaseManagementUrl?: string
}

function applyVersionToCode(code: string, version: string) {
  if (version === 'latest') return code
  return code.replace(
    /from ['"]npm:stripe-experiment-sync['"]/g,
    `from 'npm:stripe-experiment-sync@${version}'`
  )
}

function managementBaseUrl(raw?: string) {
  if (!raw) return 'https://api.supabase.com'
  const trimmed = raw.replace(/\/$/, '')
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`
}

async function managementRequest(
  path: string,
  accessToken: string,
  supabaseManagementUrl: string | undefined,
  init: RequestInit
) {
  const base = managementBaseUrl(supabaseManagementUrl)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }

  const response = await fetch(`${base}${path}`, { ...init, headers })
  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(
      `Management API ${init.method || 'GET'} ${path} failed: ${response.status} ${text}`
    )
  }
  return response
}

async function runSqlQuery(
  projectRef: string,
  accessToken: string,
  supabaseManagementUrl: string | undefined,
  query: string,
  readOnly = false
) {
  return managementRequest(
    `/v1/projects/${projectRef}/database/query`,
    accessToken,
    supabaseManagementUrl,
    {
      method: 'POST',
      body: JSON.stringify({ query, read_only: readOnly }),
    }
  )
}

export async function resolvePackageVersion(inputVersion?: string) {
  'use step'
  return inputVersion ?? VERSION ?? 'latest'
}

export async function fetchDbConnectionString(
  projectRef: string,
  accessToken: string,
  supabaseManagementUrl?: string
) {
  'use step'

  const projectInfoResponse = await managementRequest(
    `/v1/projects/${projectRef}`,
    accessToken,
    supabaseManagementUrl,
    { method: 'GET' }
  )
  const project = (await projectInfoResponse.json().catch(() => ({}))) as {
    database?: { host?: string }
  }
  const host = project.database?.host || `db.${projectRef}.supabase.co`

  const password = crypto.randomBytes(24).toString('base64url')
  const escapedPassword = password.replace(/'/g, "''")

  const sql = `
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'stripe_setup') THEN
        EXECUTE format('CREATE ROLE stripe_setup LOGIN PASSWORD %L', '${escapedPassword}');
      ELSE
        EXECUTE format('ALTER ROLE stripe_setup WITH LOGIN PASSWORD %L', '${escapedPassword}');
      END IF;
      EXECUTE 'GRANT ALL PRIVILEGES ON DATABASE postgres TO stripe_setup';
      EXECUTE 'GRANT ALL PRIVILEGES ON SCHEMA stripe TO stripe_setup';
      EXECUTE 'GRANT ALL PRIVILEGES ON SCHEMA public TO stripe_setup';
      EXECUTE 'GRANT ALL PRIVILEGES ON SCHEMA stripe TO postgres';
    END $$;
  `

  const resp = await runSqlQuery(projectRef, accessToken, supabaseManagementUrl, sql, false)
  console.log(await resp.json())

  const encodedPassword = encodeURIComponent(password)
  return `postgresql://stripe_setup:${encodedPassword}@${host}:5432/postgres`
}
export async function validateStripeKey(stripeSecretKey: string) {
  'use step'

  const trimmed = stripeSecretKey.trim()
  if (!trimmed.startsWith('sk_') && !trimmed.startsWith('rk_')) {
    throw new FatalError('Stripe key should start with "sk_" or "rk_"')
  }

  const stripeResponse = await fetch('https://api.stripe.com/v1/account', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${trimmed}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  if (!stripeResponse.ok) {
    const errorData = await stripeResponse.json().catch(() => ({}))
    const message =
      errorData.error?.message || `Invalid Stripe API key (HTTP ${stripeResponse.status})`
    throw new FatalError(`Invalid Stripe API key: ${message}`)
  }

  return trimmed
}

export async function ensureProjectAccess(
  projectRef: string,
  accessToken: string,
  supabaseManagementUrl?: string
) {
  'use step'
  await managementRequest(`/v1/projects/${projectRef}`, accessToken, supabaseManagementUrl, {
    method: 'GET',
  })
}

export async function markInstallationStarted(
  projectRef: string,
  accessToken: string,
  supabaseManagementUrl: string | undefined,
  version: string
) {
  'use step'
  const comment =
    `${STRIPE_SCHEMA_COMMENT_PREFIX} v${version} ${INSTALLATION_STARTED_SUFFIX}`.replace(/'/g, "''")
  const sql = `CREATE SCHEMA IF NOT EXISTS stripe; COMMENT ON SCHEMA stripe IS '${comment}';`
  await runSqlQuery(projectRef, accessToken, supabaseManagementUrl, sql)
}

export async function deployEdgeFunctions(
  projectRef: string,
  accessToken: string,
  supabaseManagementUrl: string | undefined,
  version: string,
  deployWorker: boolean
) {
  'use step'

  const functionsResponse = await managementRequest(
    `/v1/projects/${projectRef}/functions`,
    accessToken,
    supabaseManagementUrl,
    { method: 'GET' }
  )
  const existing = (await functionsResponse.json().catch(() => [])) as { slug?: string }[]

  const upsertFunction = async (name: string, code: string, verifyJwt = false) => {
    const payload = { body: code, name, slug: name, verify_jwt: verifyJwt }
    const exists = existing.some((fn) => fn?.slug === name)
    if (exists) {
      await managementRequest(
        `/v1/projects/${projectRef}/functions/${name}`,
        accessToken,
        supabaseManagementUrl,
        { method: 'PATCH', body: JSON.stringify({ body: code, name, verify_jwt: verifyJwt }) }
      )
    } else {
      await managementRequest(
        `/v1/projects/${projectRef}/functions`,
        accessToken,
        supabaseManagementUrl,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      )
    }
  }

  const versionedWebhook = applyVersionToCode(webhookFunctionCode, version)
  const versionedWorker = applyVersionToCode(workerFunctionCode, version)
  await upsertFunction('stripe-webhook', versionedWebhook, false)
  if (deployWorker) {
    await upsertFunction('stripe-worker', versionedWorker, false)
  }
}

export async function setStripeSecrets(
  projectRef: string,
  accessToken: string,
  supabaseManagementUrl: string | undefined,
  stripeSecretKey: string
) {
  'use step'

  const secrets = [{ name: 'STRIPE_SECRET_KEY', value: stripeSecretKey }]
  if (supabaseManagementUrl) {
    secrets.push({ name: 'MANAGEMENT_API_URL', value: supabaseManagementUrl })
  }

  await managementRequest(
    `/v1/projects/${projectRef}/secrets`,
    accessToken,
    supabaseManagementUrl,
    {
      method: 'POST',
      body: JSON.stringify(secrets),
    }
  )
}

export async function runMigrationsStep(databaseUrl: string) {
  'use step'
  await runMigrations({ databaseUrl })
  const sql = postgres(databaseUrl)
  await sql`
    GRANT USAGE ON SCHEMA stripe TO postgres;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA stripe TO postgres;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA stripe TO postgres;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA stripe TO postgres;
  `.simple()
}

export async function grantAllTablesToPostgresRole({
  projectRef,
  accessToken,
  supabaseManagementUrl,
}: {
  projectRef: string
  accessToken: string
  supabaseManagementUrl: string | undefined
}) {
  'use step'
  return null
}

export async function setupStripeWebhook(
  input: StripeSyncInstallWorkflowInput,
  projectBaseUrl: string,
  databaseUrl: string
) {
  'use step'

  const stripeSync = new StripeSync({
    poolConfig: { connectionString: databaseUrl, max: 2 },
    stripeSecretKey: input.stripeSecretKey,
  })

  try {
    await stripeSync.postgresClient.query('SELECT pg_advisory_unlock_all()')

    const webhookUrl = `https://${input.supabaseProjectRef}.${projectBaseUrl}/functions/v1/stripe-webhook`
    await stripeSync.findOrCreateManagedWebhook(webhookUrl)
  } finally {
    await stripeSync.postgresClient.pool.end()
  }
}

export async function scheduleWorker(
  projectRef: string,
  accessToken: string,
  supabaseManagementUrl: string | undefined,
  projectBaseUrl: string,
  workerIntervalSeconds: number | undefined
) {
  'use step'

  const interval =
    typeof workerIntervalSeconds === 'number' && workerIntervalSeconds > 0
      ? workerIntervalSeconds
      : DEFAULT_WORKER_INTERVAL_SECONDS

  if (!Number.isInteger(interval) || interval < 1) {
    throw new Error(`Invalid interval: ${interval}. Must be a positive integer.`)
  }

  let schedule: string
  if (interval < 60) {
    schedule = `${interval} seconds`
  } else if (interval % 60 === 0) {
    const minutes = interval / 60
    if (minutes < 60) {
      schedule = `*/${minutes} * * * *`
    } else {
      throw new Error(
        `Invalid interval: ${interval}. Intervals >= 3600 seconds (1 hour) are not supported. Use 1-3599 or a multiple of 60 < 3600.`
      )
    }
  } else {
    throw new Error(
      `Invalid interval: ${interval}. Must be either 1-59 seconds or a multiple of 60 (e.g., 60, 120, 180).`
    )
  }

  const workerSecret = crypto.randomUUID()
  const escapedWorkerSecret = workerSecret.replace(/'/g, "''")
  const sql = `
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    CREATE EXTENSION IF NOT EXISTS pg_net;
    CREATE EXTENSION IF NOT EXISTS pgmq;

    SELECT pgmq.create('stripe_sync_work')
    WHERE NOT EXISTS (
      SELECT 1 FROM pgmq.list_queues() WHERE queue_name = 'stripe_sync_work'
    );

    DELETE FROM vault.secrets WHERE name = 'stripe_sync_worker_secret';
    SELECT vault.create_secret('${escapedWorkerSecret}', 'stripe_sync_worker_secret');

    SELECT cron.unschedule('stripe-sync-worker') WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'stripe-sync-worker'
    );
    SELECT cron.unschedule('stripe-sync-scheduler') WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'stripe-sync-scheduler'
    );

    SELECT cron.schedule(
      'stripe-sync-worker',
      '${schedule}',
      $$
      SELECT net.http_post(
        url := 'https://${projectRef}.${projectBaseUrl}/functions/v1/stripe-worker',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'stripe_sync_worker_secret')
        )
      )
      $$
    );
  `

  await runSqlQuery(projectRef, accessToken, supabaseManagementUrl, sql)
}

export async function markInstalled(
  projectRef: string,
  accessToken: string,
  supabaseManagementUrl: string | undefined,
  version: string
) {
  'use step'
  const message =
    `${STRIPE_SCHEMA_COMMENT_PREFIX} v${version} ${INSTALLATION_INSTALLED_SUFFIX}`.replace(
      /'/g,
      "''"
    )
  await runSqlQuery(
    projectRef,
    accessToken,
    supabaseManagementUrl,
    `COMMENT ON SCHEMA stripe IS '${message}';`
  )
}

export async function markError(
  projectRef: string,
  accessToken: string,
  supabaseManagementUrl: string | undefined,
  version: string,
  error: unknown
) {
  'use step'
  const message = (error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, ' ')
    .slice(0, 400)
  const escaped =
    `${STRIPE_SCHEMA_COMMENT_PREFIX} v${version} ${INSTALLATION_ERROR_SUFFIX} - ${message}`.replace(
      /'/g,
      "''"
    )
  await runSqlQuery(
    projectRef,
    accessToken,
    supabaseManagementUrl,
    `COMMENT ON SCHEMA stripe IS '${escaped}';`
  )
}
