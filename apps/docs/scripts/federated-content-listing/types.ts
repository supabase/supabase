import type { FederatedContentSource } from '../federated-content/types'

/**
 * Describes a directory of external docs pages that gets listed (not
 * federated) on a local page with `<FederatedContentListing id="..." />`.
 * Each page links out to `externalSite`.
 *
 * Add a new listing by exporting a `FederatedContentListingSource` from a file
 * under `./sources` and adding it to `SOURCES` in
 * `fetch-federated-content-listing.ts`. Its `SOURCES` key is the `id`.
 */
export type FederatedContentListingSource = Pick<
  FederatedContentSource,
  'org' | 'repo' | 'branch' | 'docsDir' | 'externalSite'
> & {
  /** File names in `docsDir` to leave out of the listing, e.g. 'index.md'. */
  ignore?: string[]
}
