import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

import type { components } from 'data/api'
import { post } from 'data/fetchers'
import { PROVIDERS } from 'lib/constants'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

export type DbInstanceSize = components['schemas']['DesiredInstanceSize']

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
  dbInstanceSize?: DbInstanceSize
}

export async function createProject({
  name,
  organizationId,
  dbPass,
  dbRegion,
  dbSql,
  cloudProvider = PROVIDERS.AWS.id,
  configurationId,
  authSiteUrl,
  customSupabaseRequest,
  dbInstanceSize,
}: ProjectCreateVariables) {
  const body: components['schemas']['CreateProjectBody'] = {
    cloud_provider: cloudProvider,
    org_id: organizationId,
    name,
    db_pass: dbPass,
    db_region: dbRegion,
    db_sql: dbSql,
    auth_site_url: authSiteUrl,
    vercel_configuration_id: configurationId,
    ...(customSupabaseRequest !== undefined && {
      custom_supabase_internal_requests: customSupabaseRequest as any,
    }),
    desired_instance_size: dbInstanceSize,
  }

  const { data, error } = await post(`/platform/projects`, {
    body,
  })

  if (error) throw error
  return data
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
