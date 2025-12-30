import { EvalCase, EvalScorer } from 'braintrust'
import { LLMClassifierFromTemplate } from 'autoevals'
import { stripIndent } from 'common-tags'
import { parse } from 'libpg-query'

const LLM_AS_A_JUDGE_MODEL = 'gpt-5.2-2025-12-11'

type Input = string

type Output = {
  stepsSerialized: string
  textOnly: string
  toolNames: string[]
  sqlQueries: string[]
  docs: string[]
}

export type Expected = {
  requiredTools?: string[]
  factualAnswer?: string
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

export const sqlSyntaxScorer: EvalScorer<Input, Output, Expected> = async ({ output }) => {
  if (output.sqlQueries === undefined || output.sqlQueries.length === 0) {
    return null
  }

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

  return {
    name: 'SQL Validity',
    score: validQueries / output.sqlQueries.length,
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
    b) Acceptable verbosity - some verbosity but acceptable
    c) Too verbose - contains superfluous wording or overly verbose
  `,
  choiceScores: { a: 1, b: 0.5, c: 0 },
  useCoT: true,
  model: LLM_AS_A_JUDGE_MODEL,
})

export const concisenessScorer: EvalScorer<Input, Output, Expected> = async ({ input, output }) => {
  return await concisenessEvaluator({
    input,
    output: output.stepsSerialized,
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

export const completenessScorer: EvalScorer<Input, Output, Expected> = async ({
  input,
  output,
}) => {
  return await completenessEvaluator({
    input,
    output: output.stepsSerialized,
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

export const goalCompletionScorer: EvalScorer<Input, Output, Expected> = async ({
  input,
  output,
}) => {
  return await goalCompletionEvaluator({
    input,
    output: output.stepsSerialized,
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

export const docsFaithfulnessScorer: EvalScorer<Input, Output, Expected> = async ({ output }) => {
  // Skip scoring if no docs were retrieved
  if (!output.docs || output.docs.length === 0) {
    return null
  }

  const docsText = output.docs.join('\n\n')

  return await docsFaithfulnessEvaluator({
    docs: docsText,
    output: output.textOnly,
  })
}

const factualityEvaluator = LLMClassifierFromTemplate<{ expected: string }>({
  name: 'Factuality',
  promptTemplate: stripIndent`
    Evaluate whether the assistant's answer is factually accurate.

    Question:
    {{input}}
    
    Ground Truth:
    {{expected}}
    
    Assistant Response:
    {{output}}
    
    Is the assistant's response factually accurate according to the ground truth?
    a) Factually accurate - response is consistent with the ground truth, no contradictions
    b) Partially accurate - mostly accurate but has minor inaccuracies or unclear statements
    c) Factually inaccurate - contradicts the ground truth or makes incorrect claims
  `,
  choiceScores: { a: 1, b: 0.5, c: 0 },
  useCoT: true,
  model: LLM_AS_A_JUDGE_MODEL,
})

export const factualityScorer: EvalScorer<Input, Output, Expected> = async ({
  output,
  expected,
}) => {
  // Skip scoring if no ground truth is provided
  if (!expected.factualAnswer) {
    return null
  }

  return await factualityEvaluator({
    expected: expected.factualAnswer,
    output: output.textOnly,
  })
}
