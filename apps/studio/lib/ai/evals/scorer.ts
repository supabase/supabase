import { EvalScorer } from 'braintrust'
import { ClosedQA } from 'autoevals'

type Input = string

type Output = {
  text: string
  tools: string[]
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

export function createAssertionScorer<ToolName extends string>(): EvalScorer<
  Input,
  Output,
  Assertion<ToolName>[]
> {
  return async ({ output, expected: assertions }) => {
    const assertionResults: {
      status: string
      assertion: Assertion<ToolName>
    }[] = []

    for (const assertion of assertions) {
      let passedTest = false

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
          default:
            throw new Error(`Unknown assertion type`)
        }
      } catch (e) {
        passedTest = false
      }

      assertionResults.push({
        status: passedTest ? 'passed' : 'failed',
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
