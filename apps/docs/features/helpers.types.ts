type Json = string | number | boolean | { [key: string]: Json } | Json[]

type OrPromise<T> = T | Promise<T>

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type { Json, OrPromise, WithRequired }
