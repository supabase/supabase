import { useQuery } from '@tanstack/react-query'
import type { components } from 'api-types'

import { lintKeys } from './keys'
import type { Lint } from './lint-query'
import { handleError, post } from '@/data/fetchers'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM, PROJECT_STATUS } from '@/lib/constants'
import { EMPTY_ARR } from '@/lib/void'
import type { ResponseError, UseCustomQueryOptions } from '@/types'

type AdvisorLintName =
  components['schemas']['V2RunProjectAdvisorsBody']['data']['attributes']['lints'][number]['name']

/**
 * Health lints are on-demand only on the API side — each one opens a live database
 * connection or queries the metrics/logs store — so the endpoint runs only the lints it
 * is asked for. We request the checks that mean the project is actually broken, and leave
 * out the diagnostic ones (`db_connection_failing`, `instance_telemetry_lost`), which
 * describe the state of our own probes more than the state of the project.
 */
export const HEALTH_LINT_NAMES = [
  'instance_db_down',
  'db_not_reachable',
  'db_connection_limit_reached',
  'log_data_api_error_rate_high',
  'log_auth_error_rate_high',
  'log_storage_error_rate_high',
  'log_edge_function_error_rate_high',
  'instance_alert_firing',
] as const satisfies readonly AdvisorLintName[]

/**
 * Names the API only ever returns as a result: they report that a check could not run
 * rather than an issue with the project, and several checks can return the same one, so
 * they'd show up as duplicate non-issues in the advisor lists.
 */
const RESULT_ONLY_LINT_NAMES = new Set(['project_not_active', 'advisor_check_unavailable'])

type ProjectHealthLintsVariables = {
  projectRef?: string
}

export async function getProjectHealthLints(
  { projectRef }: ProjectHealthLintsVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('Project ref is required')

  const { data, error } = await post('/v2/projects/{ref}/advisors/run', {
    params: { path: { ref: projectRef } },
    body: {
      data: {
        type: 'project_advisors',
        attributes: { lints: HEALTH_LINT_NAMES.map((name) => ({ name })) },
      },
    },
    signal,
  })

  if (error) handleError(error)

  const lints: Lint[] = data?.data.attributes.lints ?? EMPTY_ARR
  return lints.filter((lint) => !RESULT_ONLY_LINT_NAMES.has(lint.name))
}

export type ProjectHealthLintsData = Awaited<ReturnType<typeof getProjectHealthLints>>
export type ProjectHealthLintsError = ResponseError

export const useProjectHealthLintsQuery = <TData = ProjectHealthLintsData>(
  { projectRef }: ProjectHealthLintsVariables,
  {
    enabled = true,
    ...options
  }: UseCustomQueryOptions<ProjectHealthLintsData, ProjectHealthLintsError, TData> = {}
) => {
  const { data: project } = useSelectedProjectQuery()
  const isActive = project?.status === PROJECT_STATUS.ACTIVE_HEALTHY

  return useQuery<ProjectHealthLintsData, ProjectHealthLintsError, TData>({
    queryKey: lintKeys.healthLints(projectRef),
    queryFn: ({ signal }) => getProjectHealthLints({ projectRef }, signal),
    enabled: enabled && IS_PLATFORM && typeof projectRef !== 'undefined' && isActive,
    // Every run costs a live database connection plus a metrics and a logs query, so keep
    // repeat mounts (homepage row, advisor panel) on one result and don't retry failures.
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    ...options,
  })
}
