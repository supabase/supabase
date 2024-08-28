import { parseAsString, useQueryState } from 'nuqs'

import { useParams } from 'common'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

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

  let defaultSchema = 'public'
  if (typeof window !== 'undefined') {
    defaultSchema =
      window.localStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA(ref ?? '')) || 'public'
  }

  const [schema, setSelectedSchema] = useIsomorphicUseQueryState(defaultSchema)

  // Update the schema to local storage on every change
  if (defaultSchema !== schema && typeof window !== 'undefined') {
    window.localStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA(ref ?? ''), schema)
  }

  return { selectedSchema: schema, setSelectedSchema }
}
