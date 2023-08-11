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
  configurationId?: string
}

export async function createProject({
  name,
  organizationId,
  dbPass,
  dbRegion,
  dbSql,
  configurationId,
}: ProjectCreateVariables) {
  const response = await post(`${API_URL}/projects`, {
    cloud_provider: PROVIDERS.AWS.id, // hardcoded for DB instances to be under AWS
    org_id: organizationId,
    name,
    db_pass: dbPass,
    db_region: dbRegion,
    db_sql: dbSql,
    db_pricing_tier_id: PRICING_TIER_PRODUCT_IDS.FREE,
    // auth_site_url: _store.selectedVercelProjectUrl,
    vercel_configuration_id: configurationId,
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
          toast.error(`Failed to create project: ${data.message}`)
        } else {
          onError(data, variables, context)
        }
      },
      ...options,
    }
  )
}
