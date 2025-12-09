import { EvalScorer } from 'braintrust'

type Input = string

type Output = {
  text: string
  tools: string[]
}

type Assertion =
  | {
      type: 'tools_include'
      tool: string
    }
  | {
      type: 'text_includes'
      substring: string
    }

type Expected = Assertion[]

export const AssertionScorer: EvalScorer<Input, Output, Expected> = ({
  output,
  expected: assertions,
}) => {
  const assertionResults: {
    status: string
    assertion: Assertion
  }[] = []

  let passedTest = false

  for (const assertion of assertions) {
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
