export type Maybe<T> = T | null | undefined

/**
 * Used to test whether a `Maybe` typed value is `null` or `undefined`.
 *
 * When called, the given value's type is narrowed to `NonNullable<T>`.
 *
 * ### Example Usage:
 *
 * ```ts
 * const fn = (str: Maybe<string>) => {
 *   if (!isNonNullable(str)) {
 *     // typeof str = null | undefined
 *     // ...
 *   }
 *   // typeof str = string
 *   // ...
 * }
 * ```
 */
export const isNonNullable = <T extends Maybe<unknown>>(val?: T): val is NonNullable<T> =>
  typeof val !== `undefined` && val !== null
