import { EvalCase, EvalScorer } from 'braintrust'
import { ClosedQA, Sql, LLMClassifierFromTemplate } from 'autoevals'
import { stripIndent } from 'common-tags'
import { parse } from 'libpg-query'

const LLM_AS_A_JUDGE_MODEL = 'gpt-5.2-2025-12-11'

type Input = string

type Output = {
  stepsSerialized: string
  toolNames: string[]
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

export const sqlSimilarityScorer: EvalScorer<Input, Output, Expected> = async ({
  input,
  output,
  expected,
}) => {
  if (!expected.sqlQuery) return null

  const sqlQuery = output.sqlQueries?.[0]
  let score = 0

  if (sqlQuery) {
    const sqlResult = await Sql({
      input,
      output: sqlQuery,
      expected: expected.sqlQuery,
      model: LLM_AS_A_JUDGE_MODEL,
    })
    score = sqlResult.score ?? 0
  }

  return {
    name: 'SQL Similarity',
    score,
  }
}

export const criteriaMetScorer: EvalScorer<Input, Output, Expected> = async ({
  output,
  expected,
}) => {
  if (!expected.criteria) return null

  const qaResult = await ClosedQA({
    input: 'According to the provided criterion is the submission correct?',
    output: output.stepsSerialized,
    criteria: expected.criteria,
    model: LLM_AS_A_JUDGE_MODEL,
  })

  return {
    name: 'Criteria Met',
    score: qaResult.score ?? 0,
  }
}

export const textIncludesScorer: EvalScorer<Input, Output, Expected> = async ({
  output,
  expected,
}) => {
  if (!expected.textIncludes) return null

  const includes = output.stepsSerialized.includes(expected.textIncludes)
  return {
    name: 'Text Includes',
    score: includes ? 1 : 0,
  }
}

export const sqlSyntaxScorer: EvalScorer<Input, Output, Expected> = async ({ output }) => {
  if (output.sqlQueries === undefined || output.sqlQueries.length === 0) {
    return null
  }

  const totalQueries = output.sqlQueries.length
  const errors: string[] = []
  let validQueries = 0

  for (const sql of output.sqlQueries) {
    try {
      await parse(sql)
      validQueries++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push(`SQL syntax error: ${errorMessage}`)
    }
  }

  const score = totalQueries === 0 ? 1 : validQueries / totalQueries

  return {
    name: 'SQL Validity',
    score,
    metadata: errors.length > 0 ? { errors } : undefined,
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
    b) Mostly concise - minor verbosity
    c) Some verbosity but acceptable
    d) Contains superfluous wording
    e) Overly verbose
  `,
  choiceScores: { a: 1, b: 0.75, c: 0.5, d: 0.25, e: 0 },
  useCoT: true,
  model: LLM_AS_A_JUDGE_MODEL,
})

export const concisenessScorer: EvalScorer<Input, Output, Expected> = async ({ input, output }) => {
  const result = await concisenessEvaluator({
    input,
    output: output.stepsSerialized,
  })

  return {
    name: 'Conciseness',
    score: result.score ?? 0,
  }
}

const completenessEvaluator = LLMClassifierFromTemplate<{ input: string }>({
  name: 'Completeness',
  promptTemplate: stripIndent`
    Evaluate whether this response is complete and finished, or if it appears cut off or incomplete.

    Input: {{input}}
    Output: {{output}}

    Does the response appear complete and finished?
    a) Fully complete - addresses the question fully, no cut-offs or missing parts
    b) Mostly complete - minor gaps but acceptable, response feels finished
    c) Partially complete - some aspects addressed but response feels incomplete
    d) Incomplete - response appears cut off mid-sentence or missing key information
    e) Severely incomplete - empty response, frozen, or completely cut off
  `,
  choiceScores: { a: 1, b: 0.75, c: 0.5, d: 0.25, e: 0 },
  useCoT: true,
  model: LLM_AS_A_JUDGE_MODEL,
})

export const completenessScorer: EvalScorer<Input, Output, Expected> = async ({
  input,
  output,
}) => {
  const result = await completenessEvaluator({
    input,
    output: output.stepsSerialized,
  })

  return {
    name: 'Completeness',
    score: result.score ?? 0,
  }
}
