/**
 * Synthesizes API key responses for non-platform Studio (local CLI and
 * self-hosted Docker). Both deployment modes inject the same env vars
 * (`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`, and optionally
 * `SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_SECRET_KEY`); there is no
 * CLI-vs-Docker branching here.
 *
 * Consumed by the `/api/v1/projects/[ref]/api-keys` mock routes, which
 * stand in for the platform management API on single-tenant Studio builds.
 *
 * _Only call this from server-side non-platform code._
 */
import { assertSelfHosted } from './util'

export type NonPlatformApiKey = {
  name: string
  api_key: string
  id: string
  type: 'legacy' | 'publishable' | 'secret'
  hash: string
  prefix: string
  description: string
}

/**
 * Length of the identifying prefix shown for a secret key before it is
 * revealed. Mirrors the platform management API and the `ApiKeyPill` UI, both
 * of which expose `sb_secret_` (10 chars) + 5 identifying chars = 15 (see
 * `ApiKeyPill`'s `api_key.slice(0, 15)` and the `sb_secret_8I4Se•••` mock in
 * `ApiKeysIllustrations`).
 */
const SECRET_KEY_VISIBLE_PREFIX_LENGTH = 15

export function parseRevealQuery(value: string | string[] | undefined): boolean {
  const raw = Array.isArray(value) ? value[0] : value
  return raw === 'true'
}

export function getNonPlatformApiKeys(): NonPlatformApiKey[] {
  assertSelfHosted()

  const keys: NonPlatformApiKey[] = [
    {
      name: 'anon',
      api_key: process.env.SUPABASE_ANON_KEY ?? '',
      id: 'anon',
      type: 'legacy',
      hash: '',
      prefix: '',
      description: 'Legacy anon API key',
    },
    {
      name: 'service_role',
      api_key: process.env.SUPABASE_SERVICE_KEY ?? '',
      id: 'service_role',
      type: 'legacy',
      hash: '',
      prefix: '',
      description: 'Legacy service_role API key',
    },
  ]

  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY
  if (publishableKey) {
    keys.push({
      name: 'publishable',
      api_key: publishableKey,
      id: 'publishable',
      type: 'publishable',
      hash: '',
      prefix: '',
      description: 'Publishable API key (anon role)',
    })
  }

  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (secretKey) {
    keys.push({
      name: 'secret',
      api_key: secretKey,
      id: 'secret',
      type: 'secret',
      hash: '',
      // The prefix is exposed while the rest of the key stays masked until
      // revealed (matches the platform management API). Only expose it when the
      // key is genuinely longer than the prefix — otherwise the "prefix" would
      // be the whole secret, so we mask entirely to avoid leaking a short or
      // misconfigured key in the unrevealed response.
      prefix:
        secretKey.length > SECRET_KEY_VISIBLE_PREFIX_LENGTH
          ? secretKey.slice(0, SECRET_KEY_VISIBLE_PREFIX_LENGTH)
          : '',
      description: 'Secret API key (service_role)',
    })
  }

  return keys
}

export function applyRevealToApiKey(key: NonPlatformApiKey, reveal: boolean): NonPlatformApiKey {
  if (key.type !== 'secret' || reveal) return key

  // Masked: expose only the identifying prefix, never the full secret.
  return { ...key, api_key: key.prefix }
}

export function getNonPlatformApiKeyById(
  id: string,
  reveal: boolean
): NonPlatformApiKey | undefined {
  const key = getNonPlatformApiKeys().find((entry) => entry.id === id)
  if (!key) return undefined

  return applyRevealToApiKey(key, reveal)
}
