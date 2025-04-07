import { useRouter } from 'next/router'

export const useTableEditorFilters = () => {
  const router = useRouter()
  const urlParams = new URLSearchParams(router.asPath.split('?')[1])

  const urlFilters = urlParams.getAll('filter')
  const isNewSyntax = urlFilters.length > 0 && urlFilters[0].includes(',')

  function getFilters(): string[] {
    console.log('urlParams', urlParams.getAll('filter'))
    if (isNewSyntax) {
      return urlParams.getAll('filter')[0].split(',')
    }

    return urlParams.getAll('filter')
  }

  const setParams = (
    fn: (prevParams: { filter: string[]; sort: string[] }) => { filter: string[]; sort: string[] }
  ) => {
    const currentParams = { filter: getFilters(), sort: sorts ?? [] }
    const newParams = fn(currentParams)
    router.push({
      ...router,
      query: {
        ...router.query,
        filter: newParams.filter,
        sort: newParams.sort,
      },
    })
  }

  const filters = getFilters()
  const sorts = urlParams.getAll('sort')

  console.log('filters', filters)
  console.log('sorts', sorts)

  return {
    filters,
    sorts,
    setParams,
  }
}
