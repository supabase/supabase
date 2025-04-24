type RecObj<T extends object, K extends keyof T> = T[K] extends Array<T> ? T : never

export function deepFilterRec<T extends object, K extends keyof T>(
  arr: Array<RecObj<T, K>>,
  recKey: K,
  filterFn: (item: T) => boolean
) {
  return arr.reduce(
    (acc, elem) => {
      if (!filterFn(elem)) return acc

      if (recKey in elem) {
        const newSubitems = deepFilterRec(elem[recKey] as Array<RecObj<T, K>>, recKey, filterFn)
        const newElem = { ...elem, [recKey]: newSubitems }

        if (newSubitems.length > 0 || filterFn(elem)) acc.push(newElem)
      } else {
        acc.push(elem)
      }

      return acc
    },
    [] as Array<RecObj<T, K>>
  )
}

export async function pluckPromise<T, K extends keyof T>(promise: Promise<T>, key: K) {
  return promise.then((data) => data[key])
}

export class Result<T, E> {
  constructor(private internal: { data: T; error: null } | { data: null; error: E }) {}

  static ok<T, E>(data: T): Result<T, E> {
    return new Result({ data, error: null })
  }

  static error<T, E>(err: E): Result<T, E> {
    return new Result({ data: null, error: err })
  }

  static async tryCatchFlat<A extends Array<unknown>, R, E = unknown, InnerE extends E = E>(
    fn: (...args: A) => Promise<Result<R, InnerE>>,
    onError: (error: unknown) => E,
    ...args: A
  ): Promise<Result<R, E>> {
    try {
      return await fn(...args)
    } catch (error: unknown) {
      return Result.error(onError(error))
    }
  }

  isOk(): this is Result<T, never> {
    return this.internal.error == null
  }

  map<U>(fn: (data: T) => U): Result<U, E> {
    if (this.isOk()) return Result.ok(fn(this.internal.data))
    return this as unknown as Result<U, E>
  }

  mapError<NewError>(fn: (error: E) => NewError): Result<T, NewError> {
    if (this.isOk()) return this as unknown as Result<T, NewError>
    return Result.error(fn(this.internal.error))
  }

  flatMap<U>(fn: (data: T) => Result<U, E>): Result<U, E> {
    if (this.isOk()) return fn(this.internal.data)
    return this as unknown as Result<U, E>
  }

  flatMapAsync<U>(fn: (data: T) => Promise<Result<U, E>>): Promise<Result<U, E>> {
    if (this.isOk()) return fn(this.internal.data)
    return Promise.resolve(this as unknown as Result<U, E>)
  }

  match<E2, U>(onOk: (data: T) => U, onErr: (error: E) => E2): U | E2 {
    if (this.isOk()) return onOk(this.internal.data)
    return onErr(this.internal.error)
  }

  tapEither(fn: (self: Result<T, E>) => void) {
    fn(this)
    return this
  }
}
