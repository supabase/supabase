import { FinishReason } from 'ai'
import { LLMClassifierFromTemplate } from 'autoevals'
import { EvalCase, EvalScorer, SpanData, Trace } from 'braintrust'
import { stripIndent } from 'common-tags'

import { extractUrls } from '@/lib/helpers'

const LLM_AS_A_JUDGE_MODEL = 'gpt-5.2' // NOTE: `gpt-5.2-2025-12-11` snapshot not yet working with online scorers

export type AssistantEvalInput = {
  prompt: string
  mockTables?: Record<
    string,
    Array<{
      name: string
      rls_enabled: boolean
      columns: Array<{ name: string; data_type: string }>
    }>
  >
}

export type AssistantEvalOutput = {
  finishReason: FinishReason
}

export type Expected = {
  requiredTools?: string[]
  requiredKnowledge?: string[]
  correctAnswer?: string
}

// Based on categories in the AssistantMessageRatingSubmittedEvent
export type AssistantEvalCaseCategory =
  | 'sql_generation'
  | 'schema_design'
  | 'rls_policies'
  | 'edge_functions'
  | 'database_optimization'
  | 'debugging'
  | 'general_help'
  | 'other'

export type AssistantEvalCaseMetadata = {
  category?: AssistantEvalCaseCategory[]
  description?: string
}

export type AssistantEvalCase = EvalCase<AssistantEvalInput, Expected, AssistantEvalCaseMetadata>

// --- Trace helpers ---

type ChatMessage = { role: string; content: unknown }

function isChatMessage(msg: unknown): msg is ChatMessage {
  return typeof msg === 'object' && msg !== null && 'role' in msg
}

function extractMessageText(content: unknown): string {
  if (typeof content === 'string') return content
  if (Array.isArray(content)) {
    return content
      .filter(
        (c): c is { type: 'text'; text: string } =>
          typeof c === 'object' &&
          c !== null &&
          'type' in c &&
          c.type === 'text' &&
          'text' in c &&
          typeof c.text === 'string'
      )
      .map((c) => c.text)
      .join('\n')
  }
  return ''
}

async function getLastAssistantText(trace: Trace): Promise<string | null> {
  const thread = await trace.getThread()
  for (let i = thread.length - 1; i >= 0; i--) {
    const msg = thread[i]
    if (isChatMessage(msg) && msg.role === 'assistant') {
      return extractMessageText(msg.content) || null
    }
  }
  return null
}

async function getConversationContext(trace: Trace): Promise<string> {
  const thread = await trace.getThread()
  return thread
    .filter(isChatMessage)
    .filter((m) => m.role !== 'system')
    .map((m) => `[${m.role}]\n${extractMessageText(m.content)}`)
    .join('\n\n')
}

export async function getToolSpans(trace: Trace, toolName?: string): Promise<SpanData[]> {
  const spans = await trace.getSpans({ spanType: ['tool'] })
  if (!toolName) return spans
  return spans.filter((s) => s.span_attributes?.name === toolName)
}

// --- Scorers ---

export const toolUsageScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ expected, trace }) => {
  if (!expected.requiredTools || !trace) return null

  const toolSpans = await getToolSpans(trace)
  const toolNames = toolSpans.map((s) => s.span_attributes?.name).filter(Boolean)

  const presentCount = expected.requiredTools.filter((tool) => toolNames.includes(tool)).length
  const totalCount = expected.requiredTools.length
  const ratio = totalCount === 0 ? 1 : presentCount / totalCount

  return {
    name: 'Tool Usage',
    score: ratio,
  }
}

export const knowledgeUsageScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ expected, trace }) => {
  if (!expected.requiredKnowledge || !trace) return null

  const knowledgeSpans = await getToolSpans(trace, 'load_knowledge')
  const loadedKnowledge = knowledgeSpans
    .map((s) => s.input)
    .filter(
      (input): input is { name: string } =>
        typeof input === 'object' &&
        input !== null &&
        'name' in input &&
        typeof input.name === 'string'
    )
    .map((input) => input.name)

  const presentCount = expected.requiredKnowledge.filter((k) => loadedKnowledge.includes(k)).length
  const totalCount = expected.requiredKnowledge.length
  const ratio = totalCount === 0 ? 1 : presentCount / totalCount

  return {
    name: 'Knowledge Usage',
    score: ratio,
  }
}

const concisenessEvaluator = LLMClassifierFromTemplate<{ input: string }>({
  name: 'Conciseness',
  promptTemplate: stripIndent`
    Evaluate the conciseness of this response.

    Input: {{input}}
    Output: {{output}}

    Is the response concise and free of unnecessary words?
    a) Very concise - no wasted words
    b) Acceptable verbosity - some verbosity but acceptable
    c) Too verbose - contains superfluous wording or overly verbose
  `,
  choiceScores: { a: 1, b: 0.5, c: 0 },
  useCoT: true,
  model: LLM_AS_A_JUDGE_MODEL,
})

export const concisenessScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ input, trace }) => {
  if (!trace) return null
  const text = await getLastAssistantText(trace)
  if (!text) return null
  return await concisenessEvaluator({ input: input.prompt, output: text })
}

const completenessEvaluator = LLMClassifierFromTemplate<{ input: string }>({
  name: 'Completeness',
  promptTemplate: stripIndent`
    Evaluate whether this response is complete and finished, or if it appears cut off or incomplete.

    Input: {{input}}
    Output: {{output}}

    Does the response appear complete and finished?
    a) Complete - response is complete and finished
    b) Incomplete - response appears cut off, missing parts, or severely incomplete
  `,
  choiceScores: { a: 1, b: 0 },
  useCoT: true,
  model: LLM_AS_A_JUDGE_MODEL,
})

export const completenessScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ input, trace }) => {
  if (!trace) return null
  const text = await getLastAssistantText(trace)
  if (!text) return null
  return await completenessEvaluator({ input: input.prompt, output: text })
}

const goalCompletionEvaluator = LLMClassifierFromTemplate<{ input: string }>({
  name: 'Goal Completion',
  promptTemplate: stripIndent`
    Evaluate whether this response addresses what the user asked.

    Input: {{input}}
    Output: {{output}}

    Does the response address what the user asked?
    a) Fully addresses - completely answers the question or fulfills the request
    b) Partially addresses - addresses some aspects but misses key parts
    c) Doesn't address - off-topic or fails to address the request
  `,
  choiceScores: { a: 1, b: 0.5, c: 0 },
  useCoT: true,
  model: LLM_AS_A_JUDGE_MODEL,
})

export const goalCompletionScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ input, trace }) => {
  if (!trace) return null
  const conversation = await getConversationContext(trace)
  if (!conversation) return null
  return await goalCompletionEvaluator({ input: input.prompt, output: conversation })
}

const docsFaithfulnessEvaluator = LLMClassifierFromTemplate<{ docs: string }>({
  name: 'Docs Faithfulness',
  promptTemplate: stripIndent`
    Evaluate whether the assistant's response accurately reflects the information in the retrieved documentation.

    Retrieved Documentation:
    {{docs}}

    Assistant Response:
    {{output}}

    Does the assistant's response accurately reflect the documentation without contradicting it or adding unsupported claims?
    a) Faithful - response accurately reflects the docs, no contradictions or unsupported claims
    b) Partially faithful - mostly accurate but has minor inaccuracies or unsupported details
    c) Not faithful - contradicts the docs or makes significant unsupported claims
  `,
  choiceScores: { a: 1, b: 0.5, c: 0 },
  useCoT: true,
  model: LLM_AS_A_JUDGE_MODEL,
})

export const docsFaithfulnessScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ trace }) => {
  if (!trace) return null

  const docsSpans = await getToolSpans(trace, 'search_docs')
  if (docsSpans.length === 0) return null

  const docs: string[] = []
  for (const span of docsSpans) {
    const output = span.output
    if (
      typeof output !== 'object' ||
      output === null ||
      !('content' in output) ||
      !Array.isArray(output.content)
    )
      continue
    for (const item of output.content) {
      if (
        typeof item === 'object' &&
        item !== null &&
        'text' in item &&
        typeof item.text === 'string'
      ) {
        try {
          if (!JSON.parse(item.text)?.error) docs.push(item.text)
        } catch {
          docs.push(item.text)
        }
      }
    }
  }

  if (docs.length === 0) return null

  const text = await getLastAssistantText(trace)
  if (!text) return null

  return await docsFaithfulnessEvaluator({
    docs: docs.join('\n\n'),
    output: text,
  })
}

const correctnessEvaluator = LLMClassifierFromTemplate<{ input: string; expected: string }>({
  name: 'Correctness',
  promptTemplate: stripIndent`
    Evaluate whether the assistant's answer is correct according to the expected answer.

    Question:
    {{input}}

    Expected Answer:
    {{expected}}

    Assistant Response:
    {{output}}

    Is the assistant's response correct? The response can contain additional information beyond the expected answer, but it must:
    - Include the expected answer (or equivalent information)
    - Not contradict the expected answer

    a) Correct - response includes the expected answer, no contradictions or omissions
    b) Partially correct - includes most of the expected answer but has minor omissions or contradictions
    c) Incorrect - contradicts or fails to provide the expected answer
  `,
  choiceScores: { a: 1, b: 0.5, c: 0 },
  useCoT: true,
  model: LLM_AS_A_JUDGE_MODEL,
})

export const correctnessScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ input, expected, trace }) => {
  if (!expected.correctAnswer || !trace) return null
  const text = await getLastAssistantText(trace)
  if (!text) return null
  return await correctnessEvaluator({
    input: input.prompt,
    expected: expected.correctAnswer,
    output: text,
  })
}

export const urlValidityScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ trace }) => {
  if (!trace) return null
  const text = await getLastAssistantText(trace)
  if (!text) return null

  const allUrls = extractUrls(text, { excludeCodeBlocks: true, excludeTemplates: true })
  const urls = allUrls.filter((url) => {
    try {
      const { hostname } = new URL(url)
      return hostname === 'supabase.com' || hostname.endsWith('.supabase.com')
    } catch {
      return false
    }
  })

  if (urls.length === 0) return null

  const results = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
        if (response.ok) {
          return { valid: true }
        }
        return { valid: false, error: `${url} returned ${response.status}` }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        return { valid: false, error: `${url} failed: ${errorMessage}` }
      }
    })
  )

  const errors = results.flatMap((r) => (r.error ? [r.error] : []))
  const validUrls = results.filter((r) => r.valid).length

  return {
    name: 'URL Validity',
    score: validUrls / urls.length,
    metadata: {
      urls,
      errors: errors.length > 0 ? errors : undefined,
    },
  }
}
