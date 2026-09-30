import { parseAsString, useQueryStates, type Options } from 'nuqs'
import { useMemo } from 'react'

import { parseStoragePath, serializeStoragePath } from './StorageExplorer.utils'

/**
 * Owns the two query params that address a location inside a bucket:
 * - `path` — the slash-joined folder path, e.g. `?path=images/2024`
 * - `preview` — the name of the file whose preview panel is open in that folder
 *
 * Both live in a single `useQueryStates` so that opening a folder can clear `preview`
 * and set `path` in one atomic URL write. Two separate `useQueryState` calls would push two
 * history entries per drill-down, which makes the Back button useless.
 *
 * `path` pushes history — Back should walk back up the folder chain. `preview` replaces,
 * because opening or closing a panel is not a navigation.
 */
export function useStorageExplorerUrlState() {
  const [{ path, preview }, setParams] = useQueryStates(
    { path: parseAsString.withDefault(''), preview: parseAsString.withDefault('') },
    { history: 'push', clearOnDefault: true }
  )

  return useMemo(
    () => ({
      urlPath: path,
      urlFolderPaths: parseStoragePath(path),
      urlPreview: preview,

      /**
       * Writes both params at once. `preview` is always passed explicitly so a location
       * write can carry an open preview along with it rather than clearing it.
       */
      setUrlLocation: (
        { paths, preview: previewedName }: { paths: string[]; preview: string | null },
        options?: Options
      ) => setParams({ path: serializeStoragePath(paths), preview: previewedName ?? '' }, options),

      setUrlPreview: (name: string | null) =>
        setParams({ preview: name ?? '' }, { history: 'replace' }),
    }),
    [path, preview, setParams]
  )
}
