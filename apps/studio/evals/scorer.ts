import { FinishReason } from 'ai'
import { LLMClassifierFromTemplate } from 'autoevals'
import { EvalCase, EvalScorer } from 'braintrust'
import { stripIndent } from 'common-tags'
import { extractUrls } from 'lib/helpers'

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
  steps: Array<{ text: string; toolCalls: Array<{ toolName: string; input: unknown }> }>
  toolNames: string[]
  sqlQueries: string[]
  docs: string[]
}

export type Expected = {
  requiredTools?: string[]
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

/**
 * Serialize steps into a string representation including text and tool calls
 */
function serializeSteps(steps: AssistantEvalOutput['steps']): string {
  return steps
    .map((step) => {
      const toolCalls = step.toolCalls
        ?.map((call) => JSON.stringify({ tool: call.toolName, input: call.input }))
        .join('\n')
      return toolCalls ? `${step.text}\n${toolCalls}` : step.text
    })
    .join('\n')
}

/**
 * Extract only the text content from steps, filtering out empty text
 */
function extractTextOnly(steps: AssistantEvalOutput['steps']): string {
  return steps
    .map((step) => step.text)
    .filter((text) => text && text.trim().length > 0)
    .join('\n')
}

export const toolUsageScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ output, expected }) => {
  if (!expected.requiredTools) return null

  const presentCount = expected.requiredTools.filter((tool) =>
    output.toolNames.includes(tool)
  ).length
  const totalCount = expected.requiredTools.length
  const ratio = totalCount === 0 ? 1 : presentCount / totalCount

  return {
    name: 'Tool Usage',
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
> = async ({ input, output }) => {
  return await concisenessEvaluator({
    input: input.prompt,
    output: extractTextOnly(output.steps),
  })
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
> = async ({ input, output }) => {
  return await completenessEvaluator({
    input: input.prompt,
    output: serializeSteps(output.steps),
  })
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
> = async ({ input, output }) => {
  return await goalCompletionEvaluator({
    input: input.prompt,
    output: serializeSteps(output.steps),
  })
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
> = async ({ output }) => {
  // Skip scoring if no docs were retrieved
  if (!output.docs || output.docs.length === 0) {
    return null
  }

  const docsText = output.docs.join('\n\n')

  return await docsFaithfulnessEvaluator({
    docs: docsText,
    output: extractTextOnly(output.steps),
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
> = async ({ input, output, expected }) => {
  // Skip scoring if no ground truth is provided
  if (!expected.correctAnswer) {
    return null
  }

  return await correctnessEvaluator({
    input: input.prompt,
    expected: expected.correctAnswer,
    output: extractTextOnly(output.steps),
  })
}

export const urlValidityScorer: EvalScorer<
  AssistantEvalInput,
  AssistantEvalOutput,
  Expected
> = async ({ output }) => {
  const responseText = extractTextOnly(output.steps)
  const allUrls = extractUrls(responseText, { excludeCodeBlocks: true, excludeTemplates: true })
  const urls = allUrls.filter((url) => {
    try {
      const { hostname } = new URL(url)
      return hostname === 'supabase.com' || hostname.endsWith('.supabase.com')
    } catch {
      return false
    }
  })

  // Skip if no URLs found
  if (urls.length === 0) {
    return null
  }

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

  const metadata = {
    urls,
    errors: errors.length > 0 ? errors : undefined,
  }

  return {
    name: 'URL Validity',
    score: validUrls / urls.length,
    metadata,
  }
}
