import { useRouter } from 'next/router'
import { useMemo, useCallback } from 'react'

export const useTableEditorFiltersSort = () => {
  const router = useRouter()

  const urlParams = useMemo(() => {
    const queryString = router.asPath.split('?')[1]
    return new URLSearchParams(queryString ?? '')
  }, [router.asPath])

  const filters = useMemo(() => {
    return urlParams.getAll('filter')
  }, [urlParams])

  const sorts = useMemo(() => {
    return urlParams.getAll('sort')
  }, [urlParams])

  const hiddenColsParam = useMemo(() => {
    return urlParams.get('hidden_cols')
  }, [urlParams])

  const colOrderParam = useMemo(() => {
    return urlParams.get('col_order')
  }, [urlParams])

  const hiddenColumns = useMemo(() => {
    return hiddenColsParam ? hiddenColsParam.split(',') : []
  }, [hiddenColsParam])

  const columnOrder = useMemo(() => {
    return colOrderParam ? colOrderParam.split(',') : []
  }, [colOrderParam])

  type SetParamsArgs = {
    filter?: string[] | undefined
    sort?: string[] | undefined
    hidden_cols?: string | undefined
    col_order?: string | undefined
  }

  const setParams = useCallback(
    (fn: (prevParams: SetParamsArgs) => SetParamsArgs) => {
      const prevParams: SetParamsArgs = {
        filter: filters,
        sort: sorts,
        hidden_cols: hiddenColsParam ?? undefined,
        col_order: colOrderParam ?? undefined,
      }
      const newParams = fn(prevParams)

      const nextQuery = { ...router.query }
      Object.keys(newParams).forEach((key) => {
        const k = key as keyof SetParamsArgs
        if (newParams[k] !== undefined) {
          // @ts-ignore Difficult to type this perfectly generically
          nextQuery[k] = newParams[k]
        } else {
          delete nextQuery[k]
        }
      })

      router.push({ query: nextQuery }, undefined, { shallow: true })
    },
    [router, filters, sorts, hiddenColsParam, colOrderParam]
  )

  return {
    filters,
    sorts,
    hiddenColumns,
    columnOrder,
    setParams,
  }
}
