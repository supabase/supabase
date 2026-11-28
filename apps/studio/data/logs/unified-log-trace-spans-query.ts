import { queryOptions } from '@tanstack/react-query'
import { z } from 'zod'

import { logsKeys } from './keys'
import { UNIFIED_LOGS_QUERY_OPTIONS } from './unified-logs-infinite-query'
import { constructHeaders, fetchHandler, handleError } from '@/data/fetchers'
import { API_URL, IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'

// This route is excluded from the platform OpenAPI spec (alpha endpoint, CTRL-1998),
// so it never appears in the generated `api-types` package and can't be called
// through the typed `get()`/`post()` client — hence the manual fetch + zod parse below.
const spanSchema = z.object({
  type: z.literal('span'),
  id: z.string(),
  // `.passthrough()`: the endpoint can carry attributes beyond this known set (HTTP/DB tags,
  // resource attributes, etc.) — keep them so Trace.Inspector can still show them, instead of
  // zod's default of silently stripping any key not declared here.
  attributes: z
    .object({
      parent_span_id: z.string().nullable(),
      service_name: z.string(),
      span_name: z.string(),
      span_kind: z.string(),
      status_code: z.string(),
      start_time: z.string(),
      duration_ns: z.number(),
    })
    .passthrough(),
})

const traceSpansResponseSchema = z.object({
  data: z.array(spanSchema),
  meta: z.object({ partial: z.boolean() }),
})

export type TraceSpan = z.infer<typeof spanSchema>
export type TraceSpansResponse = z.infer<typeof traceSpansResponseSchema>

export type UnifiedLogTraceSpansVariables = {
  projectRef?: string
  traceId?: string
}

export async function getUnifiedLogTraceSpans(
  { projectRef, traceId }: UnifiedLogTraceSpansVariables,
  signal?: AbortSignal
) {
  if (!projectRef) throw new Error('projectRef is required')
  if (!traceId) throw new Error('traceId is required')

  const baseUrl = API_URL?.replace('/platform', '')
  const url = `${baseUrl}/v2/projects/${projectRef}/analytics/traces/${traceId}`
  const headers = await constructHeaders()
  const res = await fetchHandler(url, { method: 'GET', headers, signal })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    handleError(body)
  }

  return traceSpansResponseSchema.parse(await res.json())
}

export type UnifiedLogTraceSpansData = Awaited<ReturnType<typeof getUnifiedLogTraceSpans>>
export type UnifiedLogTraceSpansError = StudioError

export const unifiedLogTraceSpansQueryOptions = ({
  projectRef,
  traceId,
}: UnifiedLogTraceSpansVariables) =>
  queryOptions<UnifiedLogTraceSpansData, UnifiedLogTraceSpansError>({
    queryKey: logsKeys.traceSpans(projectRef, traceId),
    queryFn: ({ signal }) => getUnifiedLogTraceSpans({ projectRef, traceId }, signal),
    enabled: IS_PLATFORM && typeof projectRef !== 'undefined' && typeof traceId !== 'undefined',
    ...UNIFIED_LOGS_QUERY_OPTIONS,
  })
