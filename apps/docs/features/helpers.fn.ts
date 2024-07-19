type RecObj<T extends object, K extends keyof T> = T[K] extends Array<T> ? T : never

function deepFilterRec<T extends object, K extends keyof T>(
  arr: Array<RecObj<T, K>>,
  recKey: K,
  filterFn: (item: T) => boolean
) {
  return arr.reduce(
    (acc, elem) => {
      if (recKey in elem) {
        const newSubitems = deepFilterRec(elem[recKey] as Array<RecObj<T, K>>, recKey, filterFn)
        const newElem = { ...elem, [recKey]: newSubitems }

        if (newSubitems.length > 0 || filterFn(elem)) acc.push(newElem)
      } else {
        if (filterFn(elem)) acc.push(elem)
      }

      return acc
    },
    [] as Array<RecObj<T, K>>
  )
}

export { deepFilterRec }
