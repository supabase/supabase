import { FinishReason } from 'ai'
import { LLMClassifierFromTemplate } from 'autoevals'
import { EvalCase, EvalScorer } from 'braintrust'
import { stripIndent } from 'common-tags'
import { parse } from 'libpg-query'
import { MOCK_TABLES_DATA } from 'lib/ai/tools/mock-tools'

const LLM_AS_A_JUDGE_MODEL = 'gpt-5.2-2025-12-11'

type Input = {
  prompt: string
  mockToolOutputs?: {
    list_tables?: Array<{
      name: string
      rls_enabled: boolean
      columns: Array<{ name: string; data_type: string }>
    }>
  }
}

type Output = {
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
}

export type AssistantEvalCase = EvalCase<Input, Expected, AssistantEvalCaseMetadata>

/**
 * Serialize steps into a string representation including text and tool calls
 */
function serializeSteps(steps: Output['steps']): string {
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
function extractTextOnly(steps: Output['steps']): string {
  return steps
    .map((step) => step.text)
    .filter((text) => text && text.trim().length > 0)
    .join('\n')
}

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
    input: input.prompt,
    output: serializeSteps(output.steps),
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

export const goalCompletionScorer: EvalScorer<Input, Output, Expected> = async ({
  input,
  output,
}) => {
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

export const docsFaithfulnessScorer: EvalScorer<Input, Output, Expected> = async ({ output }) => {
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

export const correctnessScorer: EvalScorer<Input, Output, Expected> = async ({
  input,
  output,
  expected,
}) => {
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

/**
 * Recursively traverse a libpg-query AST to extract all identifiers.
 * Collects table names from RangeVar and column names from ColumnRef.
 */
function extractIdentifiers(ast: unknown): string[] {
  const identifiers: string[] = []

  function traverse(node: unknown): void {
    if (!node || typeof node !== 'object') return

    const obj = node as Record<string, unknown>

    // RangeVar - table references
    if ('RangeVar' in obj) {
      const rv = obj.RangeVar as { relname?: string; schemaname?: string }
      if (rv.relname) identifiers.push(rv.relname)
      if (rv.schemaname) identifiers.push(rv.schemaname)
    }

    // ColumnRef - column references
    if ('ColumnRef' in obj) {
      const cr = obj.ColumnRef as { fields?: Array<{ String?: { sval?: string } }> }
      for (const field of cr.fields ?? []) {
        if (field.String?.sval) identifiers.push(field.String.sval)
      }
    }

    // Recurse into all values
    for (const value of Object.values(obj)) {
      if (Array.isArray(value)) {
        value.forEach(traverse)
      } else {
        traverse(value)
      }
    }
  }

  traverse(ast)
  return identifiers
}

export const sqlIdentifierQuotingScorer: EvalScorer<Input, Output, Expected> = async ({
  input,
  output,
}) => {
  // Skip if no SQL queries
  if (!output.sqlQueries?.length) {
    return null
  }

  // Use override if provided, otherwise fall back to default mock data
  const tables = input.mockToolOutputs?.list_tables ?? MOCK_TABLES_DATA

  // Build index: lowercase name → original name
  const schemaIndex = new Map<string, string>()
  for (const table of tables) {
    schemaIndex.set(table.name.toLowerCase(), table.name)
    for (const col of table.columns) {
      schemaIndex.set(col.name.toLowerCase(), col.name)
    }
  }

  // Find identifiers that need quoting (contain uppercase)
  const needsQuoting = (name: string) => /[A-Z]/.test(name)
  const identifiersRequiringQuotes = new Set(Array.from(schemaIndex.values()).filter(needsQuoting))

  if (identifiersRequiringQuotes.size === 0) {
    return null // Nothing to check (all lowercase)
  }

  let totalChecks = 0
  let properlyQuoted = 0
  const errors: string[] = []

  for (const sql of output.sqlQueries) {
    try {
      const ast = await parse(sql)
      const identifiers = extractIdentifiers(ast)

      for (const id of identifiers) {
        const original = schemaIndex.get(id.toLowerCase())
        if (original && needsQuoting(original)) {
          totalChecks++
          if (id === original) {
            properlyQuoted++
          } else {
            errors.push(`"${id}" should be quoted as "${original}"`)
          }
        }
      }
    } catch {
      // Parse errors handled by sqlSyntaxScorer
    }
  }

  if (totalChecks === 0) return null

  return {
    name: 'SQL Identifier Quoting',
    score: properlyQuoted / totalChecks,
    metadata: errors.length > 0 ? { errors } : undefined,
  }
}
