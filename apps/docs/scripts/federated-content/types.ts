/**
 * A single external page that gets federated into a local guide.
 */
export interface FederatedPage {
  /** Local slug, relative to `section`. Omit for the section's index page. */
  slug?: string
  meta: {
    title: string
    subtitle?: string
    description?: string
    tocVideo?: string
  }
  /** Path of the file in the remote repo, relative to `docsDir`. */
  remoteFile: string
  /** Fetch `remoteFile` from the repo root instead of `docsDir`. */
  useRoot?: boolean
  /**
   * Unconditionally drop the first heading, regardless of whether its text
   * matches `meta.title`. Use when the curated title intentionally differs
   * from the source file's own heading text.
   */
  dropLeadingHeading?: boolean
}

/**
 * Describes where to fetch a set of external docs pages from, and how they
 * map onto local `/guides/<section>` routes.
 *
 * Add a new entry point by exporting a `FederatedContentSource` as the
 * default export of a file under `./sources`.
 */
export interface FederatedContentSource {
  /** Guide section these pages are mounted under, e.g. 'graphql' -> content/guides/graphql */
  section: string
  org: string
  repo: string
  branch: string
  /** Directory in the remote repo containing the docs, e.g. 'docs'. */
  docsDir: string
  /** Public site the remote docs are also published to, used to resolve unmapped links. */
  externalSite: string
  /**
   * Unmapped links fall back to `${externalSite}/${relativePath}${hash}`. Set
   * this when `externalSite` is a source-controlled host (e.g. a GitHub blob
   * URL) that needs the file extension kept, rather than a docs site that
   * serves clean, extensionless URLs.
   */
  rawFallback?: boolean
  pageMap: FederatedPage[]
  /**
   * Non-guide files fetched verbatim (no Markdown transform), e.g. JSON data
   * consumed by a custom MDX component. Written to
   * `features/docs/generated/<outFile>`.
   */
  rawFiles?: { remoteFile: string; outFile: string }[]
}
