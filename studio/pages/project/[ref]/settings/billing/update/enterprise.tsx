import { useState, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { useStore, useFlag } from 'hooks'
import { NextPageWithLayout } from 'types'
import { API_URL, PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { get } from 'lib/common/fetch'

import Connecting from 'components/ui/Loading/Loading'
import { BillingLayout } from 'components/layouts'
import { StripeSubscription } from 'components/interfaces/Billing'
import EnterpriseUpdate from 'components/interfaces/Billing/EnterpriseUpdate'

const BillingUpdateEnterprise: NextPageWithLayout = () => {
  const { ui } = useStore()
  const router = useRouter()

  const projectRef = ui.selectedProject?.ref
  const orgSlug = ui.selectedOrganization?.slug
  const projectUpdateDisabled = useFlag('disableProjectCreationAndUpdate')

  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
  const [subscription, setSubscription] = useState<StripeSubscription>()
  const [products, setProducts] = useState<{ tiers: any[]; addons: any[] }>()
  const [paymentMethods, setPaymentMethods] = useState<any>()

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
    if (orgSlug) {
      getPaymentMethods()
    }
  }, [orgSlug])

  useEffect(() => {
    if (subscription !== undefined && !isEnterprise) {
      router.push(`/project/${projectRef}/settings/billing/update`)
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

  const getPaymentMethods = async () => {
    const orgSlug = ui.selectedOrganization?.slug ?? ''
    try {
      setIsLoadingPaymentMethods(true)
      const { data: paymentMethods, error } = await get(
        `${API_URL}/organizations/${orgSlug}/payments`
      )
      if (error) throw error
      setIsLoadingPaymentMethods(false)
      setPaymentMethods(paymentMethods)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get available payment methods: ${error.message}`,
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

  if (!products || !subscription || !isEnterprise) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Connecting />
      </div>
    )
  }

  return (
    <EnterpriseUpdate
      products={products}
      currentSubscription={subscription}
      isLoadingPaymentMethods={isLoadingPaymentMethods}
      paymentMethods={paymentMethods || []}
    />
  )
}

BillingUpdateEnterprise.getLayout = (page) => <BillingLayout>{page}</BillingLayout>

export default observer(BillingUpdateEnterprise)
