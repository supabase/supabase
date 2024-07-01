// Because {} !== {} in JS, we need a shared object instances for comparison

export const EMPTY_OBJ = {}

export const EMPTY_ARR = []

export function noop() {}

export function identity<T>(x: T): T {
  return x
}
