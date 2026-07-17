/**
 * A single external page that gets federated into a local guide.
 */
export interface FederatedPage {
  /** Local slug, relative to `section`. Omit for the section's index page. */
  slug?: string
  meta: {
    title: string
    subtitle?: string
  }
  /** Path of the file in the remote repo, relative to `docsDir`. */
  remoteFile: string
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
  pageMap: FederatedPage[]
}
