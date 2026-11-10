import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { AiSreAccessLevel, AiSreFocusWeights, AiSreTranscriptEvent } from './ai-sre.types'
import { classifyResponseError } from '@/data/error-classification'
import { constructHeaders, fetchHandler } from '@/data/fetchers'
import type { ParsedSreReport } from '@/lib/ai/sre-prompt'
import { BASE_PATH } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import type { UseCustomMutationOptions } from '@/types'

/** A live event emitted by a run, surfaced to the console and persisted as transcript. */
export type AiSreRunEvent = AiSreTranscriptEvent

export type AiSreRunVariables = {
  projectRef: string
  connectionString: string
  orgSlug?: string
  focusAreas: AiSreFocusWeights
  githubAccessLevel: AiSreAccessLevel
  /** Session-only GitHub PAT (read-only). Forwarded transiently; not persisted. */
  githubToken?: string
  /** Called for each transcript event as the run streams. */
  onEvent?: (event: AiSreRunEvent) => void
}

export async function runAiSre({
  projectRef,
  connectionString,
  orgSlug,
  focusAreas,
  githubAccessLevel,
  githubToken,
  onEvent,
}: AiSreRunVariables): Promise<ParsedSreReport> {
  const url = `${BASE_PATH}/api/ai/sre/run`
  const headers = await constructHeaders({ 'Content-Type': 'application/json' })
  const response = await fetchHandler(url, {
    headers,
    method: 'POST',
    body: JSON.stringify({
      projectRef,
      connectionString,
      orgSlug,
      focusAreas,
      githubAccessLevel,
      githubToken,
    }),
  })

  // A pre-stream failure (auth, model, opt-in) returns a JSON error, not a stream.
  if (!response.ok || !response.body) {
    let body: { error?: string; message?: string } | undefined
    try {
      body = await response.json()
    } catch {}
    throw classifyResponseError({ message: body?.error ?? body?.message, code: response.status })
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let report: ParsedSreReport | null = null
  let streamError: string | undefined

  const handleLine = (line: string) => {
    if (!line.trim()) return
    let event: any
    try {
      event = JSON.parse(line)
    } catch {
      return
    }
    if (event.type === 'report') {
      report = event.report as ParsedSreReport
    } else if (event.type === 'error') {
      streamError = event.message
      onEvent?.(event as AiSreRunEvent)
    } else {
      onEvent?.(event as AiSreRunEvent)
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) handleLine(line)
  }
  if (buffer) handleLine(buffer)

  if (!report) {
    throw classifyResponseError({
      message: streamError ?? 'The AI SRE run ended without producing a report.',
      code: 500,
    })
  }

  return report
}

type AiSreRunData = Awaited<ReturnType<typeof runAiSre>>

export const useAiSreRunMutation = ({
  onSuccess,
  onError,
  ...options
}: Omit<
  UseCustomMutationOptions<AiSreRunData, StudioError, AiSreRunVariables>,
  'mutationFn'
> = {}) => {
  return useMutation<AiSreRunData, StudioError, AiSreRunVariables>({
    mutationFn: (vars) => runAiSre(vars),
    async onSuccess(data, variables, context) {
      await onSuccess?.(data, variables, context)
    },
    async onError(error, variables, context) {
      if (onError === undefined) {
        toast.error(`AI SRE run failed: ${error.message}`)
      } else {
        onError(error, variables, context)
      }
    },
    ...options,
  })
}
