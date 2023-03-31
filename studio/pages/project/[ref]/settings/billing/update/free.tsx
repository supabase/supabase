import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { NextPageWithLayout } from 'types'
import { useStore, useFlag } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL, PRICING_TIER_PRODUCT_IDS, STRIPE_PRODUCT_IDS } from 'lib/constants'

import { BillingLayout } from 'components/layouts'
import { ExitSurvey, StripeSubscription } from 'components/interfaces/Billing'
import Connecting from 'components/ui/Loading/Loading'

const BillingUpdateFree: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()
  const projectRef = ui.selectedProject?.ref

  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const [products, setProducts] = useState<{ tiers: any[]; addons: any[] }>()
  const [subscription, setSubscription] = useState<StripeSubscription>()

  const isEnterprise =
    subscription && subscription.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.ENTERPRISE

  useEffect(() => {
    if (projectUpdateDisabled) {
      router.push(`/project/${projectRef}/settings/billing/update`)
    } else if (projectRef) {
      getStripeProducts()
      getSubscription()
    }
  }, [projectRef])

  useEffect(() => {
    if (isEnterprise) {
      router.push(`/project/${projectRef}/settings/billing/update/enterprise`)
    }
  }, [subscription])

  const getStripeProducts = async () => {
    try {
      const products = await get(`${API_URL}/stripe/products`)
      setProducts(products)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get products: ${error.message}`,
      })
    }
  }

  const getSubscription = async () => {
    try {
      if (!ui.selectedProject?.subscription_id) {
        throw new Error('Unable to get subscription ID of project')
      }

      const subscription = await get(`${API_URL}/projects/${projectRef}/subscription`)
      if (subscription.error) throw subscription.error
      setSubscription(subscription)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get subscription: ${error.message}`,
      })
    }
  }

  const freeTier = products?.tiers.find((tier: any) => tier.id === STRIPE_PRODUCT_IDS.FREE)

  if (isEnterprise)
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Connecting />
      </div>
    )

  return (
    <div className="mx-auto my-10 max-w-5xl px-32 xl:px-0">
      <ExitSurvey
        freeTier={freeTier}
        subscription={subscription}
        onSelectBack={() => router.push(`/project/${projectRef}/settings/billing/update`)}
      />
    </div>
  )
}

BillingUpdateFree.getLayout = (page) => <BillingLayout>{page}</BillingLayout>

export default observer(BillingUpdateFree)
