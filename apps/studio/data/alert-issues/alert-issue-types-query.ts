import { queryOptions } from '@tanstack/react-query'
import z from 'zod/v4'

import { alertIssueTypeSchema } from './alert-issue.schema'
import { alertIssuesKeys } from './keys'
import { fetchGet } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import { isStudioError } from '@/lib/errors/studio-errors'

export type AlertIssueTypesVariables = { projectRef?: string }

async function getAlertIssueTypes({ projectRef }: AlertIssueTypesVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetchGet<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/issue-types`,
    { abortSignal: signal }
  )
  if (isStudioError(response)) throw response

  return z.array(alertIssueTypeSchema).parse(response)
}

export type AlertIssueTypesData = Awaited<ReturnType<typeof getAlertIssueTypes>>

/** Alert issue types with the project's silence state. */
export const alertIssueTypesQueryOptions = ({ projectRef }: AlertIssueTypesVariables) =>
  queryOptions({
    queryKey: alertIssuesKeys.types(projectRef),
    queryFn: ({ signal }) => getAlertIssueTypes({ projectRef }, signal),
    enabled: !IS_PLATFORM && typeof projectRef !== 'undefined',
  })
