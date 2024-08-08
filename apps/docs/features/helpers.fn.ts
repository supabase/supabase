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

export function pluckPromise<T, K extends keyof T>(promise: Promise<T>, key: K) {
  return promise.then((data) => data[key])
}
