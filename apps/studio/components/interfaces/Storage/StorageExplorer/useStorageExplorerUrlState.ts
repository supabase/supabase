import { parseAsString, useQueryStates, type Options } from 'nuqs'

import { parseStoragePath, serializeStoragePath } from './StorageExplorer.utils'

/**
 * Owns the two query params that address a location inside a bucket:
 * - `path` — the slash-joined folder path, e.g. `?path=images/2024`
 * - `file` — the name of the previewed file within that folder
 *
 * Both live in a single `useQueryStates` so that opening a folder can clear `file` and
 * set `path` in one atomic URL write. Two separate `useQueryState` calls would push two
 * history entries per drill-down, which makes the Back button useless.
 *
 * `path` pushes history — Back should walk back up the folder chain. `file` replaces,
 * because opening or closing a preview is not a navigation.
 */
export function useStorageExplorerUrlState() {
  const [{ path, file }, setParams] = useQueryStates(
    { path: parseAsString.withDefault(''), file: parseAsString.withDefault('') },
    { history: 'push', clearOnDefault: true }
  )

  return {
    urlPath: path,
    urlFolderPaths: parseStoragePath(path),
    urlFile: file,

    /**
     * Writes both params at once. `file` is always passed explicitly so a location
     * write can carry an open preview along with it rather than clearing it.
     */
    setUrlLocation: (
      { paths, file: fileName }: { paths: string[]; file: string | null },
      options?: Options
    ) => setParams({ path: serializeStoragePath(paths), file: fileName ?? '' }, options),

    setUrlFile: (name: string | null) => setParams({ file: name ?? '' }, { history: 'replace' }),
  }
}
