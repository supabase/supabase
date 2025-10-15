import { createClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'

import {
  useTemporaryAPIKeyQuery,
  type TemporaryAPIKeyData,
} from 'data/api-keys/temp-api-keys-query'
import {
  useProjectSettingsV2Query,
  type ProjectSettings,
} from 'data/config/project-settings-v2-query'

const getSupabaseClient = ({
  projectRef,
  settings,
  temporaryApiKey,
}: {
  projectRef?: string
  settings?: ProjectSettings
  temporaryApiKey?: TemporaryAPIKeyData
}) => {
  if (!projectRef) {
    return undefined
  }
  const protocol = settings?.app_config?.protocol ?? 'https'
  const endpoint = settings?.app_config?.endpoint

  const clientEndpoint = `${protocol}://${endpoint}`

  const apiKey = temporaryApiKey?.api_key

  if (apiKey === undefined) {
    return undefined
  }

  const client = createClient(clientEndpoint, apiKey)

  return client
}

export const useSupabaseClientQuery = (
  { projectRef }: { projectRef?: string },
  { enabled = true, ...options } = {}
) => {
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: temporaryApiKey } = useTemporaryAPIKeyQuery({ projectRef })

  return useQuery(
    [projectRef, 'supabase-client', temporaryApiKey?.api_key],
    () => getSupabaseClient({ projectRef, settings, temporaryApiKey }),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && !!settings && !!temporaryApiKey,
      ...options,
    }
  )
}
