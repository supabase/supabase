export type ReadonlyRecursive<T> = {
  readonly [P in keyof T]: ReadonlyRecursive<T[P]>
}
