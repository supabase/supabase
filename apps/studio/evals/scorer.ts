import { EvalCase, EvalScorer } from 'braintrust'
import { ClosedQA, Sql } from 'autoevals'

// `autoevals` relies on tool-calling for some graders. Some newer models can
// occasionally return non-tool responses, which surfaces as:
// "no tool call in the OpenAI response".
//
// Keep the preferred judge model, but fall back to a very reliable tool-calling model
// to prevent eval runs from hard-failing due to transient/non-deterministic outputs.
const PRIMARY_JUDGE_MODEL = 'gpt-5'
const FALLBACK_JUDGE_MODEL = 'gpt-4o-mini-2024-07-18'

function shouldFallbackJudgeModel(error: unknown) {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes('no tool call')
}

async function withJudgeFallback<T>(run: (model: string) => Promise<T>): Promise<T> {
  try {
    return await run(PRIMARY_JUDGE_MODEL)
  } catch (error) {
    if (!shouldFallbackJudgeModel(error)) throw error
    return await run(FALLBACK_JUDGE_MODEL)
  }
}

type Input = string

type Output = {
  text: string
  tools: string[]
  sqlQueries?: string[]
}

export type Expected = {
  requiredTools?: string[]
  sqlQuery?: string
  criteria?: string
  textIncludes?: string
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
}

export type AssistantEvalCase = EvalCase<Input, Expected, AssistantEvalCaseMetadata>

export const toolUsageScorer: EvalScorer<Input, Output, Expected> = async ({
  output,
  expected,
}) => {
  if (!expected.requiredTools) return null

  const presentCount = expected.requiredTools.filter((tool) => output.tools.includes(tool)).length
  const totalCount = expected.requiredTools.length
  const ratio = totalCount === 0 ? 1 : presentCount / totalCount

  return {
    name: 'tool_usage',
    score: ratio,
  }
}

export const sqlSimilarityScorer: EvalScorer<Input, Output, Expected> = async ({
  input,
  output,
  expected,
}) => {
  if (!expected.sqlQuery) return null

  const sqlQuery = output.sqlQueries?.[0]
  if (!sqlQuery) {
    return {
      name: 'sql_similarity',
      score: 0,
    }
  }

  const sqlResult = await withJudgeFallback((model) =>
    Sql({
      input,
      output: sqlQuery,
      expected: expected.sqlQuery,
      model,
    })
  )

  return {
    name: 'sql_similarity',
    score: sqlResult.score ?? 0,
  }
}

export const criteriaMetScorer: EvalScorer<Input, Output, Expected> = async ({
  output,
  expected,
}) => {
  if (!expected.criteria) return null

  const qaResult = await withJudgeFallback((model) =>
    ClosedQA({
      input: 'According to the provided criterion is the submission correct?',
      output: output.text,
      criteria: expected.criteria,
      model,
    })
  )

  return {
    name: 'criteria_met',
    score: qaResult.score ?? 0,
  }
}

export const textIncludesScorer: EvalScorer<Input, Output, Expected> = async ({
  output,
  expected,
}) => {
  if (!expected.textIncludes) return null

  const includes = output.text.includes(expected.textIncludes)
  return {
    name: 'text_includes',
    score: includes ? 1 : 0,
  }
}

