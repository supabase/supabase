import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { Dispatch, SetStateAction } from 'react'

/**
 * Returns which schemas are ok to be sent to AI.
 */
export function useSchemasForAi(
  ref: string
): readonly [string[], Dispatch<SetStateAction<string[]>>] {
  const [enabledSchemas, setEnabledSchemas] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_SCHEMA(ref),
    ['public']
  )

  if (!ref) return [[], () => {}]

  return [enabledSchemas, setEnabledSchemas]
}
