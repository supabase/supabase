import { createClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'

import { useTemporaryAPIKeyQuery } from 'data/api-keys/temp-api-keys-query'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'

const getSupabaseClient = ({
  projectRef,
  endpoint,
  temporaryApiKey,
}: {
  projectRef?: string
  endpoint?: string
  temporaryApiKey?: string
}) => {
  if (!projectRef) {
    return undefined
  }
  if (!endpoint) {
    return undefined
  }

  if (temporaryApiKey === undefined) {
    return undefined
  }

  const supabaseClient = createClient(endpoint, temporaryApiKey)

  return { supabaseClient, temporaryApiKey }
}

export const useSupabaseClientQuery = (
  { projectRef }: { projectRef?: string },
  { enabled = true, ...options } = {}
) => {
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: temporaryApiKeyData } = useTemporaryAPIKeyQuery({ projectRef })

  const endpoint = settings
    ? `${settings?.app_config?.protocol ?? 'https'}://${settings?.app_config?.endpoint}`
    : undefined
  const temporaryApiKey = temporaryApiKeyData?.api_key

  return useQuery({
    queryKey: [projectRef, 'supabase-client', endpoint, temporaryApiKey],
    queryFn: () => getSupabaseClient({ projectRef, endpoint, temporaryApiKey }),
    enabled: enabled && typeof projectRef !== 'undefined' && !!endpoint && !!temporaryApiKey,
    ...options,
  })
}
