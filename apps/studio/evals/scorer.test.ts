import type { Trace } from 'braintrust'
import { describe, expect, it, vi } from 'vitest'

import { urlValidityScorer, type AssistantEvalOutput } from './scorer'
import type { Transcript } from './transcript'

const DOCS_URL = 'https://supabase.com/docs/guides/auth'

/**
 * Minimal stand-in for a live Trace. Only getThread is exercised by the online
 * fallback path (see resolveTranscript in scorer.ts).
 */
const mockTrace = (thread: unknown[]) => {
  const getThread = vi.fn().mockResolvedValue(thread)
  return { trace: { getThread } as unknown as Trace, getThread }
}

const THREAD_WITH_DOCS_URL = [
  { role: 'user', content: 'Where are the auth docs?' },
  { role: 'assistant', content: [{ type: 'text', text: `See ${DOCS_URL} for details.` }] },
]

const transcript = (lastAssistantTurn: string): Transcript => ({
  currentUserInput: 'Where are the auth docs?',
  priorConversation: null,
  lastAssistantTurn,
  lastAssistantTurnWithToolInputs: lastAssistantTurn,
})

const runUrlValidityScorer = (output: AssistantEvalOutput | null, trace?: Trace) =>
  urlValidityScorer({
    input: { prompt: 'Where are the auth docs?' },
    expected: {},
    output,
    trace,
  })

describe('scorers with online (null) output', () => {
  // Online scorers run against live production logs, which have no eval task
  // and therefore no output at all — Braintrust passes null.
  it('returns null instead of throwing when there is neither output nor trace', async () => {
    await expect(runUrlValidityScorer(null)).resolves.toBeNull()
  })

  it('derives the transcript from the trace when output is null', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 })
    vi.stubGlobal('fetch', fetchMock)

    const { trace, getThread } = mockTrace(THREAD_WITH_DOCS_URL)
    const result = await runUrlValidityScorer(null, trace)

    expect(getThread).toHaveBeenCalled()
    expect(result).toMatchObject({ name: 'URL Validity', score: 1, metadata: { urls: [DOCS_URL] } })

    vi.unstubAllGlobals()
  })

  it('prefers the offline task transcript over the trace when both are present', async () => {
    const { trace, getThread } = mockTrace(THREAD_WITH_DOCS_URL)
    const output = {
      finishReason: 'stop' as const,
      transcript: transcript('No links here, just prose.'),
    }

    // No supabase URLs in the offline transcript, so the scorer opts out.
    await expect(runUrlValidityScorer(output, trace)).resolves.toBeNull()
    expect(getThread).not.toHaveBeenCalled()
  })
})
