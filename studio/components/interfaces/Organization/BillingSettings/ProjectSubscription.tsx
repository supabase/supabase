import { FC, useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { get as _get, maxBy } from 'lodash'
import utc from 'dayjs/plugin/utc'

import { useStore, useSubscriptionStats } from 'hooks'
import { API_URL } from 'lib/constants'
import { Dictionary } from '@supabase/grid'
import { get, post } from 'lib/common/fetch'
import { DATE_FORMAT, STRIPE_PRODUCT_IDS } from 'lib/constants'
import { Subscription, StripeSubscription, chargeableProducts } from 'components/interfaces/Billing'

dayjs.extend(utc)

interface Props {
  project: any
}

const ProjectSubscription: FC<Props> = ({ project }) => {
  const { ui } = useStore()
  const subscriptionStats = useSubscriptionStats()

  const [loading, setLoading] = useState<boolean>(true)
  const [subscription, setSubscription] = useState<StripeSubscription>()
  const [paygStats, setPaygStats] = useState<Dictionary<number>>()

  useEffect(() => {
    getSubscription()
  }, [])

  const getSubscription = async () => {
    try {
      setLoading(true)
      const { data: subscription, error }: { data: StripeSubscription; error: any } = await post(
        `${API_URL}/stripe/subscription`,
        {
          subscription_id: project.subscription_id,
        }
      )
      if (error) throw error
      setSubscription(subscription)

      if (subscription.tier.prod_id === STRIPE_PRODUCT_IDS.PAYG) {
        fetchPaygStatistics()
      }
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get project subscription: ${error.message}`,
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchPaygStatistics = async () => {
    const startDate = dayjs().utc().startOf('month').format(DATE_FORMAT)
    const endDate = dayjs().utc().endOf('month').format(DATE_FORMAT)
    const attributes =
      'total_db_size_bytes,total_db_egress_bytes,total_storage_size_bytes,total_storage_egress'
    const url = `${API_URL}/projects/${
      project.ref
    }/daily-stats?attribute=${attributes}&startDate=${encodeURIComponent(
      startDate
    )}&endDate=${encodeURIComponent(endDate)}&interval='1d'`

    const { data } = await get(url)

    const paygStats: any = {}
    chargeableProducts.forEach((product: any) => {
      product.features.forEach((feature: any) => {
        paygStats[feature.attribute] = _get(maxBy(data, feature.attribute), feature.attribute)
      })
    })
    setPaygStats(paygStats)
  }

  return (
    <Subscription
      showProjectName
      loading={loading}
      project={project}
      // @ts-ignore
      subscription={subscription}
      paygStats={paygStats}
      subscriptionStats={subscriptionStats}
      // @ts-ignore
      currentPeriodStart={subscription?.billing.current_period_start}
      // @ts-ignore
      currentPeriodEnd={subscription?.billing.current_period_end}
    />
  )
}

export default ProjectSubscription
