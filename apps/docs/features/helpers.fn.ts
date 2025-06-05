const EMPTY_ARRAY = new Array(0)
export function getEmptyArray() {
  return EMPTY_ARRAY
}

export function deepFilterRec<T extends object>(
  arr: Array<T>,
  recKey: string,
  filterFn: (item: T) => boolean
): Array<T> {
  return arr.reduce((acc, elem) => {
    if (!filterFn(elem)) return acc

    if (recKey in elem && elem[recKey as keyof T]) {
      const newSubitems = deepFilterRec(elem[recKey as keyof T] as Array<T>, recKey, filterFn)
      const newElem = { ...elem, [recKey]: newSubitems }

      if (newSubitems.length > 0 || filterFn(elem)) acc.push(newElem)
    } else {
      acc.push(elem)
    }

    return acc
  }, [] as Array<T>)
}

export async function pluckPromise<T, K extends keyof T>(promise: Promise<T>, key: K) {
  const data = await promise
  return data[key]
}

export class Result<Ok, Error> {
  constructor(private internal: { data: Ok; error: null } | { data: null; error: Error }) {}

  static ok<Error = unknown, Ok = unknown>(data: Ok): Result<Ok, Error> {
    return new Result<Ok, Error>({ data, error: null })
  }

  static error<Ok = unknown, Error = unknown>(error: Error): Result<Ok, Error> {
    return new Result<Ok, Error>({ data: null, error })
  }

  static async tryCatchFlat<
    Ok,
    Args extends Array<unknown> = [],
    OuterError = unknown,
    InnerError = unknown,
  >(
    fn: (...args: Args) => Promise<Result<Ok, InnerError>>,
    onError: (error: unknown) => OuterError | InnerError,
    ...args: Args
  ): Promise<Result<Ok, OuterError | InnerError>> {
    try {
      return await fn(...args)
    } catch (error: unknown) {
      return Result.error(onError(error))
    }
  }

  isOk(): this is Result<Ok, never> {
    return this.internal.error == null
  }

  map<Mapped>(fn: (data: Ok) => Mapped): Result<Mapped, Error> {
    if (this.isOk()) return Result.ok(fn(this.internal.data!))
    return this as unknown as Result<Mapped, Error>
  }

  mapError<MappedError>(fn: (error: Error) => MappedError): Result<Ok, MappedError> {
    if (this.isOk()) return this as unknown as Result<Ok, MappedError>
    return Result.error(fn(this.internal.error!))
  }

  flatMap<Mapped>(fn: (data: Ok) => Result<Mapped, Error>): Result<Mapped, Error> {
    if (this.isOk()) return fn(this.internal.data!)
    return this as unknown as Result<Mapped, Error>
  }

  flatMapAsync<Mapped>(
    fn: (data: Ok) => Promise<Result<Mapped, Error>>
  ): Promise<Result<Mapped, Error>> {
    if (this.isOk()) return fn(this.internal.data!)
    return Promise.resolve(this as unknown as Result<Mapped, Error>)
  }

  match<Mapped, MappedError>(
    onOk: (data: Ok) => Mapped,
    onError: (error: Error) => MappedError
  ): Mapped | MappedError {
    if (this.isOk()) return onOk(this.internal.data!)
    return onError(this.internal.error!)
  }
}
