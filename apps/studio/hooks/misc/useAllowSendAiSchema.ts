import { IS_PLATFORM } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useOrgOptedIntoAi } from 'hooks/misc/useOrgOptedIntoAi'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'

export function useAllowSendAiSchema() {
  const isOptedInToAI = useOrgOptedIntoAi()
  const [hasEnabledAISchema] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_AI_SCHEMA, true)
  const includeSchemaMetadata = (isOptedInToAI || !IS_PLATFORM) && hasEnabledAISchema

  return includeSchemaMetadata
}
