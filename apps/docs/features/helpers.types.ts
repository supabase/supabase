type OrPromise<T> = T | Promise<T>

type Json = string | number | boolean | { [key: string]: Json } | Json[]

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type { Json, OrPromise, WithRequired }
