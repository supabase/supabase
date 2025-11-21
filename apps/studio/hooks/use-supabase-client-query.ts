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

  return { supabaseClient }
}

/**
 * The client uses a temporary API key to authenticate requests. The API key expires after one hour which may cause
 * 401 errors for all requests made with the client. It's easily fixable by refreshing the page.
 */
export const useSupabaseClientQuery = (
  { projectRef }: { projectRef?: string },
  { enabled = true, ...options } = {}
) => {
  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { data: temporaryApiKeyData } = useTemporaryAPIKeyQuery({ projectRef, expiry: 3600 })

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
