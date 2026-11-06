export type Json = string | number | boolean | { [key: string]: Json } | Json[]

export type OrPromise<T> = T | Promise<T>

export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }
