import { EvalScorer } from 'braintrust'
import { ClosedQA, Sql } from 'autoevals'

type Input = string

type Output = {
  text: string
  tools: string[]
  sqlQueries?: string[]
}

export type Assertion<ToolName extends string = string> =
  | {
      type: 'tools_include'
      tool: ToolName
    }
  | {
      type: 'text_includes'
      substring: string
    }
  | {
      type: 'llm_criteria_met'
      criteria: string
    }
  | {
      type: 'sql_similar'
      sql: string
    }

export function createAssertionScorer<ToolName extends string>(): EvalScorer<
  Input,
  Output,
  Assertion<ToolName>[]
> {
  return async ({ input, output, expected: assertions }) => {
    const assertionResults: {
      status: string
      statusDetail?: string
      assertion: Assertion<ToolName>
    }[] = []

    for (const assertion of assertions) {
      let passedTest = false
      let statusDetail: string | undefined

      try {
        switch (assertion.type) {
          case 'tools_include': {
            passedTest = output.tools.includes(assertion.tool)
            break
          }
          case 'text_includes': {
            passedTest = output.text.includes(assertion.substring)
            break
          }
          case 'llm_criteria_met': {
            const closedQA = await ClosedQA({
              input: 'According to the provided criterion is the submission correct?',
              criteria: assertion.criteria,
              output: output.text,
            })
            passedTest = closedQA.score !== null && closedQA.score > 0.5
            break
          }
          case 'sql_similar': {
            const sqlQueries = output.sqlQueries || []
            if (sqlQueries.length === 0) {
              passedTest = false
              break
            }
            // Check if any of the generated SQL queries are similar to the expected SQL
            const similarityScores = await Promise.all(
              sqlQueries.map(async (generatedSql) => {
                const sqlScore = await Sql({
                  input,
                  output: generatedSql,
                  expected: assertion.sql,
                })
                return sqlScore.score ?? 0
              })
            )
            passedTest = similarityScores.some((score) => score > 0.5)
            statusDetail = similarityScores
              .map((score, index) => `SQL ${index + 1}: ${score}`)
              .join('\n')
            break
          }
          default:
            throw new Error(`Unknown assertion type`)
        }
      } catch (e) {
        passedTest = false
      }

      assertionResults.push({
        status: passedTest ? 'passed' : 'failed',
        statusDetail,
        assertion,
      })
    }

    const passedCount = assertionResults.filter((r) => r.status === 'passed').length
    const totalCount = assertionResults.length
    const ratioPassed = totalCount === 0 ? 1 : passedCount / totalCount

    return {
      name: 'Assertions Score',
      score: ratioPassed,
      metadata: {
        assertionResults,
      },
    }
  }
}
