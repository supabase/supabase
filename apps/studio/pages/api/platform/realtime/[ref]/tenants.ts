import type { NextApiRequest, NextApiResponse } from 'next'
import { getDatabaseByRef, getEnvValue } from '@/lib/api/self-hosted/registry'

/**
 * POST/PUT  /api/platform/realtime/:ref/tenants
 *   Register (or update) the Realtime tenant for a given database ref.
 *
 * Only available in self-hosted (non-platform) mode.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only available in self-hosted deployments
  if (process.env.IS_PLATFORM === 'true') {
    return res.status(404).json({ error: 'Not available on platform' })
  }

  const { ref } = req.query as { ref: string }
  const db = getDatabaseByRef(ref)

  if (!db) {
    return res.status(404).json({ error: `Database '${ref}' not found in registry` })
  }

  const realtimeUrl = process.env.SUPABASE_REALTIME_URL ?? 'http://realtime:4000'
  const anonKey = process.env.ANON_KEY ?? ''
  const password = getEnvValue(db.password_env)
  const jwtSecret = getEnvValue(db.jwt_secret_env)

  if (req.method === 'PUT' || req.method === 'POST') {
    const payload = {
      tenant: {
        external_id: db.ref,
        name: db.name,
        db_host: db.host,
        db_port: String(db.port),
        db_name: db.database,
        db_user: 'supabase_admin',
        db_password: password,
        db_ssl: false,
        jwt_secret: jwtSecret,
        max_concurrent_users: 200,
        max_events_per_second: 100,
        postgres_cdc_default: 'postgres_cdc_rls',
        poll_interval_ms: 100,
        poll_max_changes: 100,
        poll_max_record_bytes: 1048576,
        ip_version: 'auto',
        enable_authorization: false,
      },
    }

    const response = await fetch(`${realtimeUrl}/api/tenants/${ref}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const error = await response.text()
      return res.status(response.status).json({ error })
    }

    return res.status(200).json({ message: `Realtime tenant '${ref}' registered` })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}