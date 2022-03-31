import dayjs from 'dayjs'
import useSWR from 'swr'
import { get as _get, maxBy } from 'lodash'
import { get } from 'lib/common/fetch'
import { API_URL, DATE_FORMAT, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { chargeableProducts } from 'components/interfaces/Billing'
import { Dictionary } from '@supabase/grid'

/**
 * Get project payg statistics
 *
 * @param ref project reference
 * @param tierProdId tier product supabase_prod_id
 */
export function useProjectPaygStatistics(ref?: string, tierProdId?: string) {
  const startDate = dayjs().utc().startOf('month').format(DATE_FORMAT)
  const endDate = dayjs().utc().endOf('month').format(DATE_FORMAT)
  const attributes =
    'total_db_size_bytes,total_db_egress_bytes,total_storage_size_bytes,total_storage_egress'
  const url = `${API_URL}/projects/${ref}/daily-stats?attribute=${attributes}&startDate=${encodeURIComponent(
    startDate
  )}&endDate=${encodeURIComponent(endDate)}&interval='1d'`
  /**
   * data is a dictionary
   * {
   *   data: array,
   *   totalAverage: number,
   *   total: number,
   *   maximum: number,
   *   format: string,
   * }
   */
  const { data, error } = useSWR<any>(
    ref && tierProdId === PRICING_TIER_PRODUCT_IDS.PAYG ? url : null,
    get
  )
  const anyError = data?.error || error

  return {
    paygStats: anyError ? undefined : getPaygStats(data?.data),
    error: anyError,
    isLoading: !anyError && !data,
    isError: !!anyError,
  }
}

function getPaygStats(data: any): Dictionary<number> {
  const paygStats: any = {}
  if (!data) return paygStats

  chargeableProducts.forEach((product: any) => {
    product.features.forEach((feature: any) => {
      paygStats[feature.attribute] = _get(maxBy(data, feature.attribute), feature.attribute)
    })
  })
  return paygStats
}
