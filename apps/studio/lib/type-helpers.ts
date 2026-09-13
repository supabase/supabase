export type PlainObject<Value = unknown> = Record<string | number | symbol, Value>

export type Prettify<T> = { [K in keyof T]: T[K] } & {}

type Primitive = string | number | bigint | boolean | symbol | null | undefined

export type DeepReadonly<T> = T extends Primitive
  ? T
  : T extends (infer R)[]
    ? ReadonlyArray<DeepReadonly<R>>
    : T extends object
      ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
      : T
