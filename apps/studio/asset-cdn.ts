type Env = Record<string, string | undefined>

/**
 * Origin of the Cloudflare R2 asset CDN, or `undefined` when assets are served
 * by the host. Enabled on production deployments or with `FORCE_ASSET_CDN=1`;
 * `FORCE_ASSET_CDN=-1` (e.g. self-hosted) always disables it.
 */
export function getAssetCdnOrigin(env: Env = process.env): string | undefined {
  if (env.FORCE_ASSET_CDN === '-1') return undefined
  if (env.FORCE_ASSET_CDN !== '1' && env.VERCEL_ENV !== 'production') return undefined

  return env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
    ? 'https://frontend-assets.supabase.green'
    : 'https://frontend-assets.supabase.com'
}

/**
 * CDN base for the TanStack build's client assets. The folder is shared by
 * every deployment rather than keyed by commit: the files under it are
 * content-hashed, so identical chunks dedupe across deploys, and a tab opened
 * on an older deployment keeps finding its lazy chunks no matter which
 * deployment serves the next document. Must match the destination in
 * `scripts/upload-static-assets.sh`.
 */
export function getTanstackAssetCdnUrl(env: Env = process.env): string | undefined {
  const origin = getAssetCdnOrigin(env)
  if (!origin) return undefined
  return `${origin}/${env.SITE_NAME || 'studio'}/tanstack`
}

/**
 * Nitro's Vercel immutable store, the only directory uploaded to the CDN.
 * Anything outside it (public files, non-Vercel builds) stays on the host.
 */
const IMMUTABLE_ASSETS_DIR = '_vercel/immutable/'

/**
 * Web workers (Vite `?worker` output, e.g. graphiql's Monaco workers) must
 * stay same-origin: browsers refuse to construct a Worker from a cross-origin
 * script, and the CSP only allows `worker-src 'self' blob: data:`.
 */
export function isWorkerAsset(filename: string): boolean {
  return /\.worker-[\w-]+\.js$/.test(filename)
}

/**
 * CDN URL for a built client file, given its path relative to the output root
 * (`_vercel/immutable/<salt>/nitro/<file>`), or `undefined` to keep the host URL.
 */
export function getCdnUrlForBuiltFile(
  filename: string,
  cdnUrl: string | undefined
): string | undefined {
  if (!cdnUrl || !filename.startsWith(IMMUTABLE_ASSETS_DIR) || isWorkerAsset(filename)) {
    return undefined
  }
  return `${cdnUrl}/${filename}`
}

/**
 * Rewrites an absolute asset URL from TanStack Start's manifest
 * (`${basePath}/_vercel/immutable/...`) to the CDN, returning it unchanged when
 * it isn't an uploaded asset.
 */
export function toCdnAssetUrl(url: string, cdnUrl: string | undefined, basePath = ''): string {
  const prefix = `${basePath}/`
  if (!url.startsWith(prefix)) return url
  return getCdnUrlForBuiltFile(url.slice(prefix.length), cdnUrl) ?? url
}
