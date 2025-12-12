import { EvalCase, EvalScorer } from 'braintrust'
import { ClosedQA, Sql } from 'autoevals'

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

export type AssistantEvalCase = EvalCase<Input, Expected, void>

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
