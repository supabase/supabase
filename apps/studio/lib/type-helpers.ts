export type PlainObject<Value = unknown> = Record<string | number | symbol, Value>

export type Prettify<T> = { [K in keyof T]: T[K] } & {}
