import { EvalCase, EvalScorer } from 'braintrust'
import { ClosedQA, Sql } from 'autoevals'

const LLM_AS_A_JUDGE_MODEL = 'gpt-5.2-2025-12-11'

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

  const sqlResult = await Sql({
    input,
    output: sqlQuery,
    expected: expected.sqlQuery,
    model: LLM_AS_A_JUDGE_MODEL,
  })

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

  const qaResult = await ClosedQA({
    input: 'According to the provided criterion is the submission correct?',
    output: output.text,
    criteria: expected.criteria,
    model: LLM_AS_A_JUDGE_MODEL,
  })

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
