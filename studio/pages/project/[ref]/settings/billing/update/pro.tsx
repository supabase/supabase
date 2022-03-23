import { useState, useEffect } from 'react'
import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'
import { useRouter } from 'next/router'

import { withAuth, useStore } from 'hooks'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'

import { BillingLayout } from 'components/layouts'
import Connecting from 'components/ui/Loading/Loading'
import { StripeSubscription } from 'components/interfaces/Billing'
import { ProUpgrade } from 'components/interfaces/Billing'

const BillingUpdatePro: NextPage = () => {
  const { ui } = useStore()
  const router = useRouter()

  const projectRef = ui.selectedProject?.ref
  const orgSlug = ui.selectedOrganization?.slug

  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)

  const [subscription, setSubscription] = useState<StripeSubscription>()
  const [products, setProducts] = useState<{ tiers: any[]; addons: any[] }>()
  const [paymentMethods, setPaymentMethods] = useState<any>()

  useEffect(() => {
    // User added a new payment method
    if (router.query.setup_intent && router.query.redirect_status) {
      ui.setNotification({ category: 'success', message: 'Successfully added new payment method' })
    }
  }, [])

  useEffect(() => {
    if (projectRef) {
      getStripeProducts()
      getSubscription()
    }
  }, [projectRef])

  useEffect(() => {
    if (orgSlug) {
      getPaymentMethods()
    }
  }, [orgSlug])

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

  if (!products || !subscription) return <Connecting />

  return (
    <BillingLayout>
      <ProUpgrade
        products={products}
        currentSubscription={subscription}
        isLoadingPaymentMethods={isLoadingPaymentMethods}
        paymentMethods={paymentMethods || []}
        onSelectBack={() => router.push(`/project/${projectRef}/settings/billing/update`)}
      />
    </BillingLayout>
  )
}

export default withAuth(observer(BillingUpdatePro))
