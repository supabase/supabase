declare module 'expect' {
  interface AsymmetricMatchers {
    toMatchCriteria(criteria: string): void
  }
  interface Matchers<R> {
    toMatchCriteria(criteria: string): R
  }
}
