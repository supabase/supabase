import useSWR from 'swr'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { StripeSubscription } from 'components/interfaces/Billing'

/**
 * Get project payg statistics
 *
 * todo: this looks like a duplicate
 * of /studio/hooks/misc/useProjectSubscription.tsx
 *
 * @param ref project reference
 */
export function useProjectSubscription(ref: string | undefined) {
  const url = `${API_URL}/projects/${ref}/subscription`
  const { data, error } = useSWR<StripeSubscription & { error?: string }>(url, get)
  const anyError = data?.error || error

  return {
    subscription: anyError ? null : (data as StripeSubscription),
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}
