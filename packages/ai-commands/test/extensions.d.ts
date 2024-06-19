import 'expect'

declare module 'expect' {
  interface Matchers {
    /**
     * Check that a string matches a natural language criteria
     * describing the expected output. Uses a LLM to evaluate.
     */
    toMatchCriteria(criteria: string): Promise<void>
  }
}
