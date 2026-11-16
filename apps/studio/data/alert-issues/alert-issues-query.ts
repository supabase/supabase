import { queryOptions } from '@tanstack/react-query'
import z from 'zod/v4'

import { alertIssueSchema } from './alert-issue.schema'
import { alertIssuesKeys } from './keys'
import { fetchGet } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import { isStudioError, type StudioError } from '@/lib/errors/studio-errors'

export type AlertIssuesVariables = { projectRef?: string }
export type AlertIssuesError = StudioError | Error

async function getAlertIssues({ projectRef }: AlertIssuesVariables, signal?: AbortSignal) {
  if (!projectRef) throw new Error('projectRef is required')

  const response = await fetchGet<unknown>(
    `${API_URL}/platform/projects/${projectRef}/alerts/issues`,
    { abortSignal: signal }
  )
  if (isStudioError(response)) throw response

  return z.array(alertIssueSchema).parse(response)
}

export type AlertIssuesData = Awaited<ReturnType<typeof getAlertIssues>>

/** Alert issues are served by self-hosted Studio only until the platform API exposes them. */
export const alertIssuesQueryOptions = ({ projectRef }: AlertIssuesVariables) =>
  queryOptions({
    queryKey: alertIssuesKeys.list(projectRef),
    queryFn: ({ signal }) => getAlertIssues({ projectRef }, signal),
    enabled: !IS_PLATFORM && typeof projectRef !== 'undefined',
  })
