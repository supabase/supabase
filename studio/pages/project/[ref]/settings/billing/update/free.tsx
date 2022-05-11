import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL, STRIPE_PRODUCT_IDS } from 'lib/constants'

import { BillingLayout } from 'components/layouts'
import { ExitSurvey, StripeSubscription } from 'components/interfaces/Billing'
import { NextPageWithLayout } from 'types'

const BillingUpdateFree: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()
  const projectRef = ui.selectedProject?.ref

  const [products, setProducts] = useState<{ tiers: any[]; addons: any[] }>()
  const [subscription, setSubscription] = useState<StripeSubscription>()
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  useEffect(() => {
    if (projectRef) {
      getStripeProducts()
      getSubscription()
    }
  }, [projectRef])

  const getStripeProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const products = await get(`${API_URL}/stripe/products`)
      setProducts(products)
      setIsLoadingProducts(false)
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

  return (
    <div className="mx-auto my-10 max-w-5xl">
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
