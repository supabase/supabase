import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import { post } from 'lib/common/fetch'
import { API_URL, PRICING_TIER_PRODUCT_IDS, PROVIDERS } from 'lib/constants'
import { ProjectBase, ResponseError } from 'types'
import { projectKeys } from './keys'

export type ProjectCreateVariables = {
  name: string
  organizationId: number
  dbPass: string
  dbRegion: string
  dbSql?: string
  dbPricingTierId?: string
  cloudProvider?: string
  configurationId?: string
  authSiteUrl?: string
  customSupabaseRequest?: object
}

export async function createProject({
  name,
  organizationId,
  dbPass,
  dbRegion,
  dbSql,
  dbPricingTierId = PRICING_TIER_PRODUCT_IDS.FREE,
  cloudProvider = PROVIDERS.AWS.id,
  configurationId,
  authSiteUrl,
  customSupabaseRequest,
}: ProjectCreateVariables) {
  const response = await post(`${API_URL}/projects`, {
    cloud_provider: cloudProvider,
    org_id: organizationId,
    name,
    db_pass: dbPass,
    db_region: dbRegion,
    db_sql: dbSql,
    db_pricing_tier_id: dbPricingTierId,
    auth_site_url: authSiteUrl,
    vercel_configuration_id: configurationId,
    ...(customSupabaseRequest !== undefined && {
      custom_supabase_internal_requests: customSupabaseRequest,
    }),
  })
  if (response.error) throw response.error
  return response as ProjectBase
}

type ProjectCreateData = Awaited<ReturnType<typeof createProject>>

export const useProjectCreateMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseMutationOptions<ProjectCreateData, ResponseError, ProjectCreateVariables>,
  'mutationFn'
> = {}) => {
  const queryClient = useQueryClient()

  return useMutation<ProjectCreateData, ResponseError, ProjectCreateVariables>(
    (vars) => createProject(vars),
    {
      async onSuccess(data, variables, context) {
        await queryClient.invalidateQueries(projectKeys.list()),
          await onSuccess?.(data, variables, context)
      },
      async onError(data, variables, context) {
        if (onError === undefined) {
          toast.error(`Failed to create new project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
