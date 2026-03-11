import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo } from 'react'

import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useParams } from 'common'

/**
 * This hook wraps useQueryState because useQueryState imports app router for some reason which breaks the SSR in
 * the playwright tests. I've localized the issue to "NODE_ENV='test'" in the playwright tests.
 */
const useIsomorphicUseQueryState = (defaultSchema: string) => {
  if (typeof window === 'undefined') {
    return [defaultSchema, () => {}] as const
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryState(
      'schema',
      parseAsString.withDefault(defaultSchema).withOptions({
        clearOnDefault: false,
      })
    )
  }
}

export const useQuerySchemaState = () => {
  const { ref } = useParams()

  // In self-hosted (multi-project) mode each project's tables live in co_{ref}.
  // Default to that schema so the Table Editor shows the right schema immediately.
  const selfHostedDefault = !IS_PLATFORM && ref ? `co_${ref}` : 'public'

  const defaultSchema =
    typeof window !== 'undefined' && ref && ref.length > 0
      ? window.localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA(ref)) || selfHostedDefault
      : selfHostedDefault

  // cache the original default schema so that it's not changed by another tab and cause issues in the app (saving a
  // table on the wrong schema)
  const originalDefaultSchema = useMemo(() => defaultSchema, [ref])
  const [schema, setSelectedSchema] = useIsomorphicUseQueryState(originalDefaultSchema)

  useEffect(() => {
    // Update the schema in local storage on every change
    if (typeof window !== 'undefined' && ref && ref.length > 0) {
      window.localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA(ref), schema)
    }
  }, [schema, ref])

  return { selectedSchema: schema, setSelectedSchema }
}
