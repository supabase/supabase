import useSWR, { mutate } from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

export interface SubscriptionStats {
  total_paid_projects: number
  total_free_projects: number
  total_pro_projects: number
  total_payg_projects: number
}

export function useSubscriptionStats() {
  const url = `${API_URL}/profile/subscriptions`
  const { data, error } = useSWR<any>(url, get)
  const anyError = data?.error || error

  return {
    total_paid_projects: data?.total_paid_projects ?? 0,
    total_free_projects: data?.total_free_projects ?? 0,
    total_pro_projects: data?.total_pro_projects ?? 0,
    total_payg_projects: data?.total_payg_projects ?? 0,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
