import 'vitest'

interface CustomMatchers<R = unknown> {
  toMatchCriteria(criteria: string): R
}

declare module 'vitest' {
  // `Matchers<R, T>` augments both `Assertion` and `AsymmetricMatchersContaining`.
  interface Matchers<R, T> extends CustomMatchers<R> {}
}
