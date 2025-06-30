import { useQueryState } from 'nuqs'
import { get } from 'data/fetchers'

export function useEdgeFunctionReportFilters() {
  const [functionId, setFunctionId] = useQueryState('functionId', {
    defaultValue: '',
  })

  return {
    functionId,
    setFunctionId,
  }
}
