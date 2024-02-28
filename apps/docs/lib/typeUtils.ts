// https://www.totaltypescript.com/get-keys-of-an-object-where-values-are-of-a-given-type
type KeysOfValue<T extends object, TCondition> = {
  [K in keyof T]: T[K] extends TCondition ? K : never
}[keyof T]

export type { KeysOfValue }
