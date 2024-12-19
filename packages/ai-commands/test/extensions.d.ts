import 'vitest'

interface CustomMatchers<R = unknown> {
  toMatchCriteria(criteria: string): R
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
