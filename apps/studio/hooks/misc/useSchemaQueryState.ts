import { parseAsString, useQueryState } from 'nuqs'

import { useParams } from 'common'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

/**
 * This hook wraps useQueryState because useQueryState imports app router for some reason which breaks the SSR in
 * the playwright tests. I've localized the issue to "NODE_ENV='test'" in the playwright tests.
 */
const useIsomorphicUseQueryState = (defaultSchema: string) => {
  if (typeof window === 'undefined') {
    return [defaultSchema, () => {}] as const
  } else {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useQueryState('schema', parseAsString.withDefault(defaultSchema))
  }
}

export const useQuerySchemaState = () => {
  const { ref } = useParams()
  const [defaultSchema, setDefaultSchema] = useLocalStorage(
    LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA(ref ?? ''),
    'public'
  )

  const [schema, setSchema] = useIsomorphicUseQueryState(defaultSchema)

  const setSelectedSchema = useCallback(
    (schema: string) => {
      setDefaultSchema(schema)
      setSchema(schema)
    },
    [setDefaultSchema, setSchema]
  )

  return { selectedSchema: schema, setSelectedSchema }
}
