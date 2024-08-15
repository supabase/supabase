import { parseAsString, useQueryState } from 'nuqs'

import { useParams } from 'common'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'

export const useQuerySchemaState = () => {
  const { ref } = useParams()
  console.log(ref)
  const [defaultSchema, setDefaultSchema] = useLocalStorage(
    LOCAL_STORAGE_KEYS.LAST_SELECTED_SCHEMA(ref ?? ''),
    'public'
  )

  const [schema, setSchema] = useQueryState('schema', parseAsString.withDefault(defaultSchema))

  const setSelectedSchema = useCallback(
    (schema: string) => {
      setDefaultSchema(schema)
      setSchema(schema)
    },
    [setDefaultSchema, setSchema]
  )

  return { selectedSchema: schema, setSelectedSchema }
}
