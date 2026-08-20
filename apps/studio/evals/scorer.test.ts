import type { Trace } from 'braintrust'
import { describe, expect, it, vi } from 'vitest'

import {
  toolUsageScorer,
  urlValidityScorer,
  type AssistantEvalOutput,
  type Expected,
} from './scorer'
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

/**
 * Minimal stand-in for a live Trace exposing only the tool spans
 * toolUsageScorer reads via getToolSpans. `input`, when provided as a plain
 * object, passes straight through getToolSpanInput's AI-SDK-tuple unwrap
 * (which only fires for array-shaped span.input), so it lands as-is.
 */
const mockToolTrace = (calls: Array<{ name: string; input?: unknown }>) => {
  const getSpans = vi
    .fn()
    .mockResolvedValue(calls.map(({ name, input }) => ({ span_attributes: { name }, input })))
  return { trace: { getSpans } as unknown as Trace }
}

const runToolUsageScorer = (expected: Expected, trace?: Trace) =>
  toolUsageScorer({ input: { prompt: 'irrelevant' }, expected, output: null, trace })

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

describe('toolUsageScorer', () => {
  it('returns null when expected specifies neither requiredTools nor forbiddenTools', async () => {
    const { trace } = mockToolTrace([])
    await expect(runToolUsageScorer({}, trace)).resolves.toBeNull()
  })

  it('returns null when there is no trace', async () => {
    await expect(runToolUsageScorer({ requiredTools: ['execute_sql'] })).resolves.toBeNull()
  })

  it('scores 1 when every required tool is called and no forbidden tool is called', async () => {
    const { trace } = mockToolTrace([{ name: 'execute_sql' }, { name: 'list_tables' }])
    const result = await runToolUsageScorer(
      { requiredTools: ['execute_sql', 'list_tables'], forbiddenTools: ['execute_sql_v2'] },
      trace
    )
    expect(result).toMatchObject({ name: 'Tool Usage', score: 1 })
  })

  it('gives partial credit for a missing required tool rather than scoring 0', async () => {
    const { trace } = mockToolTrace([{ name: 'execute_sql' }])
    const result = await runToolUsageScorer(
      { requiredTools: ['execute_sql', 'list_tables'] },
      trace
    )
    expect(result).toMatchObject({ score: 0.5 })
  })

  it('gives partial credit when a forbidden tool is called alongside all required tools', async () => {
    const { trace } = mockToolTrace([{ name: 'execute_sql' }, { name: 'drop_table' }])
    const result = await runToolUsageScorer(
      { requiredTools: ['execute_sql'], forbiddenTools: ['drop_table'] },
      trace
    )
    expect(result).toMatchObject({
      score: 0.5,
      metadata: { violatedForbiddenTools: ['drop_table'] },
    })
  })

  it('scores 0 when only a forbidden tool is called and the required tool is missing', async () => {
    const { trace } = mockToolTrace([{ name: 'drop_table' }])
    const result = await runToolUsageScorer(
      { requiredTools: ['execute_sql'], forbiddenTools: ['drop_table'] },
      trace
    )
    expect(result).toMatchObject({
      score: 0,
      metadata: { violatedForbiddenTools: ['drop_table'] },
    })
  })

  it('omits violation metadata when no forbidden tool is called', async () => {
    const { trace } = mockToolTrace([{ name: 'execute_sql' }])
    const result = await runToolUsageScorer(
      { requiredTools: ['execute_sql'], forbiddenTools: ['drop_table'] },
      trace
    )
    expect(result).toMatchObject({ score: 1, metadata: undefined })
  })

  it('matches a required tool object by exact input field', async () => {
    const { trace } = mockToolTrace([{ name: 'execute_sql', input: { sql: 'select 1' } }])
    const result = await runToolUsageScorer(
      { requiredTools: [{ name: 'execute_sql', input: { sql: { equals: 'select 1' } } }] },
      trace
    )
    expect(result).toMatchObject({ score: 1 })
  })

  it('matches a required tool object by partial input via stringIncludes', async () => {
    const { trace } = mockToolTrace([
      { name: 'execute_sql', input: { sql: 'select * from users where id = 1' } },
    ])
    const result = await runToolUsageScorer(
      {
        requiredTools: [{ name: 'execute_sql', input: { sql: { stringIncludes: 'from users' } } }],
      },
      trace
    )
    expect(result).toMatchObject({ score: 1 })
  })

  it('does not match a required tool object when the input field differs', async () => {
    const { trace } = mockToolTrace([{ name: 'execute_sql', input: { sql: 'select 1' } }])
    const result = await runToolUsageScorer(
      { requiredTools: [{ name: 'execute_sql', input: { sql: { equals: 'select 2' } } }] },
      trace
    )
    expect(result).toMatchObject({ score: 0 })
  })
})
