/**
 * Which git ref to fetch definitions from.
 *
 * - `branch`: the tip of a branch, e.g. `main` (or `master`). Always the latest.
 * - `tag`: one exact tag, for a pinned or older version.
 * - `latestTag`: the newest tag matching a regex, resolved at fetch time.
 */
export type FederatedReferenceRef =
  | { branch: string }
  | { tag: string }
  | { latestTag: { pattern: string } }

/**
 * One version of a library's reference, mounted at one route.
 */
export interface FederatedReferenceVersion {
  /**
   * Where the version lives under `content/reference-beta`, and therefore its
   * route: `server` -> `/reference-beta/server`, `javascript/v1` ->
   * `/reference-beta/javascript/v1`. Its `index.md` is authored in this repo;
   * the fetched definitions are written to `<path>/definitions/`.
   */
  path: string
  ref: FederatedReferenceRef
  /** Directory in the remote repo holding the definition `.md` files. */
  definitionsDir: string
  /**
   * Skip with a warning, keeping whatever definitions are already on disk,
   * when `definitionsDir` doesn't exist at `ref` yet. Use while a library is
   * still publishing its first definitions. Without it, a missing directory
   * fails the fetch.
   */
  optional?: boolean
}

/**
 * Describes where to fetch a library's reference definitions from.
 *
 * Add a library by exporting a `FederatedReferenceSource` as the default
 * export of a file under `./sources`. Definition files must follow the schema
 * in `features/reference-beta/ReferenceBeta.schema.ts`; the fetch fails
 * listing every file that doesn't.
 */
export interface FederatedReferenceSource {
  org: string
  repo: string
  versions: FederatedReferenceVersion[]
}
