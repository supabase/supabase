import * as Sentry from '@sentry/nextjs'
import { useMutation, UseMutationOptions, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { components } from 'data/api'
import { handleError, post } from 'data/fetchers'
import { PROVIDERS } from 'lib/constants'
import type { ResponseError } from 'types'
import { projectKeys } from './keys'

const WHITELIST_ERRORS = [
  'The following organization members have reached their maximum limits for the number of active free projects',
  'db_pass must be longer than or equal to 4 characters',
  'There are overdue invoices in the organization(s)',
  'name should not contain a . string',
  'Project creation in the Supabase dashboard is disabled for this Vercel-managed organization.',
  'Your account, which is handled by the Fly Supabase extension, cannot access this endpoint.',
]

export type DbInstanceSize = components['schemas']['DesiredInstanceSize']
export type ReleaseChannel = components['schemas']['ReleaseChannel']
export type PostgresEngine = components['schemas']['PostgresEngine']

export type ProjectCreateVariables = {
  name: string
  organizationId: number
  dbPass: string
  dbRegion: string
  dbSql?: string
  dbPricingTierId?: string
  cloudProvider?: string
  authSiteUrl?: string
  customSupabaseRequest?: object
  dbInstanceSize?: DbInstanceSize
  dataApiExposedSchemas?: string[]
  dataApiUseApiSchema?: boolean
  postgresEngine?: PostgresEngine
  releaseChannel?: ReleaseChannel
}

export async function createProject({
  name,
  organizationId,
  dbPass,
  dbRegion,
  dbSql,
  cloudProvider = PROVIDERS.AWS.id,
  authSiteUrl,
  customSupabaseRequest,
  dbInstanceSize,
  dataApiExposedSchemas,
  dataApiUseApiSchema,
  postgresEngine,
  releaseChannel,
}: ProjectCreateVariables) {
  const body: components['schemas']['CreateProjectBody'] = {
    cloud_provider: cloudProvider,
    org_id: organizationId,
    name,
    db_pass: dbPass,
    db_region: dbRegion,
    db_sql: dbSql,
    auth_site_url: authSiteUrl,
    ...(customSupabaseRequest !== undefined && {
      custom_supabase_internal_requests: customSupabaseRequest as any,
    }),
    desired_instance_size: dbInstanceSize,
    data_api_exposed_schemas: dataApiExposedSchemas,
    data_api_use_api_schema: dataApiUseApiSchema,
    postgres_engine: postgresEngine,
    release_channel: releaseChannel,
  }

  const { data, error } = await post(`/platform/projects`, {
    body,
  })

  if (error) handleError(error)
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
        if (!WHITELIST_ERRORS.some((error) => data.message.includes(error))) {
          Sentry.captureMessage('[CRITICAL] Failed to create project: ' + data.message)
        }
      },
      ...options,
    }
  )
}
