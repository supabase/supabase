import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import useSWR from 'swr'

interface Data {
  tier: {
    name: string
    prod_id: string
    key: 'FREE' | 'PRO' | 'PAYG'
    unit_amount: number
  }
  addons: any[]
  billing: {
    billing_cycle_anchor: number
    current_period_end: number
    current_period_start: number
  }
}

interface Handlers {
  refresh: () => void
}

const useProjectSubscription = (projectRef: string): [Data | null, Handlers] => {
  const { data, error, mutate } = useSWR<Data>(
    projectRef ? `${API_URL}/projects/${projectRef}/subscription` : null,
    get
  )
  const refresh = () => mutate()
  if (!data) return [null, { refresh }]
  if (error) return [null, { refresh }]
  return [data, { refresh }]
}

export default useProjectSubscription
