import { EvalCase, EvalScorer } from 'braintrust'
import { ClosedQA, Sql, LLMClassifierFromTemplate } from 'autoevals'
import { stripIndent } from 'common-tags'
import { parse } from 'libpg-query'

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
    output: output.text,
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

  const includes = output.text.includes(expected.textIncludes)
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
    output: output.text,
  })

  return {
    name: 'Conciseness',
    score: result.score ?? 0,
  }
}
