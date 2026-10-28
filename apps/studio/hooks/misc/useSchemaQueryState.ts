import { LOCAL_STORAGE_KEYS, safeLocalStorage, useParams } from 'common'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useMemo, useState } from 'react'

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

const getLastSelectedSchema = (ref: string | undefined) =>
  ref && ref.length > 0
    ? safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA(ref)) || 'public'
    : 'public'

export const useQuerySchemaState = () => {
  const { ref } = useParams()

  const defaultSchema = getLastSelectedSchema(ref)

  // cache the original default schema so that it's not changed by another tab and cause issues in the app (saving a
  // table on the wrong schema)
  const originalDefaultSchema = useMemo(() => defaultSchema, [ref])
  const [schema, setSelectedSchema] = useIsomorphicUseQueryState(originalDefaultSchema)

  useEffect(() => {
    // Update the schema in local storage on every change
    if (ref && ref.length > 0) {
      safeLocalStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA(ref), schema)
    }
  }, [schema, ref])

  return { selectedSchema: schema, setSelectedSchema }
}

/**
 * The project's last selected schema, without the `?schema` URL state, for surfaces whose URL
 * already identifies something else. It shares storage with `useQuerySchemaState`, so a schema
 * picked here is the one the Table Editor opens on, and vice versa.
 */
export const useLastSelectedSchema = () => {
  const { ref } = useParams()
  // Keyed by project, so switching projects falls back to that project's stored schema.
  const [selection, setSelection] = useState<{ ref: string | undefined; schema: string }>()

  const selectedSchema =
    selection !== undefined && selection.ref === ref ? selection.schema : getLastSelectedSchema(ref)

  const setSelectedSchema = (schema: string) => {
    setSelection({ ref, schema })
    if (ref && ref.length > 0) {
      safeLocalStorage.setItem(LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA(ref), schema)
    }
  }

  return { selectedSchema, setSelectedSchema }
}
