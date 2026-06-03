export type SiteTlsMode = 'off' | 'acme' | 'byo'

export type Site = {
  /** Stable, UUID-formatted id derived from the slug. */
  id: string
  slug: string
  domain: string
  /** Folder under the hosting root that nginx serves (defaults to the slug). */
  docroot: string
  /** Serve index.html for unknown routes (single-page app routing). */
  spaFallback: boolean
  tls: SiteTlsMode
  /** Proxy /rest, /auth, /storage, /functions… to Kong for a same-origin backend. */
  apiProxy: boolean
  created_at: number
  updated_at: number
}

/** Shape of `<WEB_HOSTING_ROOT>/.hosting/sites.json`. */
export type SitesRegistry = {
  sites: Site[]
}

export type SiteFileEntry = {
  /** Path relative to the site docroot. */
  relativePath: string
  size: number
}

export type SiteFileInput = {
  /** Path relative to the docroot (may include sub-folders). */
  name: string
  content: Uint8Array | string
}
