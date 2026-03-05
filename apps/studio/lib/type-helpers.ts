export type PlainObject<Value = unknown> = Record<string | number | symbol, Value>

export type Prettify<T> = { [K in keyof T]: T[K] } & {}

export type DeepReadonly<T> = T extends (infer R)[]
  ? ReadonlyArray<DeepReadonly<R>>
  : T extends Object
    ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
    : T
