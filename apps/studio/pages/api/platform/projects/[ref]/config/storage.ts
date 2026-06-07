import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { NextApiRequest, NextApiResponse } from 'next'

// [console fork] Persist the project's Storage config overrides so the Storage
// settings page (file size limit, image transformation, S3 protocol, analytics +
// vector buckets) sticks across reloads. Supabase keeps this in its platform DB;
// we don't, so we persist per-project to disk and deep-merge over sensible
// self-host defaults. Mirrors the auth-config persistence pattern.
const CONFIG_DIR = join(process.cwd(), '.storage-config')
const overridesPath = (ref: string) => join(CONFIG_DIR, `${ref}.json`)

// Defaults for shared infra (50 MB upload limit, image transformation + S3
// protocol available). Self-host policy: nothing is plan-gated, so Analytics
// (Iceberg) + Vector buckets are enabled by default (no "Upgrade to Pro"). The
// user can still turn them off via the Storage settings toggles; the override is
// what makes `useIsAnalyticsBucketsEnabled` / `useIsVectorBucketsEnabled` stick.
const DEFAULT = {
  fileSizeLimit: 52428800,
  features: {
    imageTransformation: { enabled: true },
    s3Protocol: { enabled: true },
    icebergCatalog: { enabled: false, maxCatalogs: 2 },
    vectorBuckets: { enabled: false },
  },
  capabilities: { list_v2: true },
  external: { upstreamTarget: 'main' },
}

type StorageConfig = typeof DEFAULT & Record<string, unknown>

function readOverrides(ref: string): Record<string, unknown> {
  try {
    return JSON.parse(readFileSync(overridesPath(ref), 'utf8'))
  } catch {
    return {}
  }
}

function writeOverrides(ref: string, overrides: Record<string, unknown>) {
  if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true })
  writeFileSync(overridesPath(ref), JSON.stringify(overrides, null, 2), 'utf8')
}

// Deep-merge so a PATCH of just `{ features: { vectorBuckets: { enabled: true } } }`
// keeps the other feature flags intact.
function deepMerge<T extends Record<string, any>>(base: T, override: Record<string, any>): T {
  const out: Record<string, any> = Array.isArray(base) ? [...base] : { ...base }
  for (const [key, value] of Object.entries(override ?? {})) {
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      out[key] &&
      typeof out[key] === 'object'
    ) {
      out[key] = deepMerge(out[key], value)
    } else {
      out[key] = value
    }
  }
  return out as T
}

const resolved = (ref: string): StorageConfig =>
  deepMerge(DEFAULT, readOverrides(ref)) as StorageConfig

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const ref = String(req.query.ref ?? '')

  if (req.method === 'GET') {
    return res.status(200).json(resolved(ref))
  }
  if (req.method === 'PATCH' || req.method === 'PUT' || req.method === 'POST') {
    const merged = deepMerge(readOverrides(ref), req.body ?? {})
    writeOverrides(ref, merged)
    return res.status(200).json(resolved(ref))
  }
  res.setHeader('Allow', ['GET', 'PATCH'])
  return res.status(405).json({ error: { message: `Method ${req.method} Not Allowed` } })
}
