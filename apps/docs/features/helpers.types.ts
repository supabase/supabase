type OrPromise<T> = T | Promise<T>

type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] }

export type { OrPromise, WithRequired }
