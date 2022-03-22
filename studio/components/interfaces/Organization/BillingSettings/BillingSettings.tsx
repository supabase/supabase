import { useRouter } from 'next/router'
import { FC, useState, useEffect } from 'react'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { getURL } from 'lib/helpers'
import { get, post } from 'lib/common/fetch'

import AWSMarketplaceSubscription from './AWSMarketplaceSubscription'
import ProjectsSummary from './ProjectsSummary'
import CreditBalance from './CreditBalance'
import PaymentMethods from './PaymentMethods'
import BillingAddress from './BillingAddress'
import TaxID from './TaxID'

interface Props {
  organization: any
  projects: any[]
}

const BillingSettings: FC<Props> = ({ organization, projects = [] }) => {
  const router = useRouter()
  const { ui } = useStore()

  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)

  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<any>(undefined)
  const [customer, setCustomer] = useState<any>(null)
  const [taxIds, setTaxIds] = useState<any>(null)
  const [paymentMethods, setPaymentMethods] = useState<any>(null)

  const { slug, stripe_customer_id, stripe_customer_object } = organization

  const defaultPaymentMethod = customer?.invoice_settings?.default_payment_method ?? ''
  const customerBalance = customer && customer.balance ? customer.balance / 100 : 0
  const isCredit = customerBalance < 0
  const isDebt = customerBalance > 0
  const balance =
    isCredit && customerBalance !== 0
      ? customerBalance.toString().replace('-', '')
      : customerBalance

  useEffect(() => {
    getPaymentMethods()
  }, [slug])

  useEffect(() => {
    if (stripe_customer_id) {
      getStripeAccount()
    }
  }, [stripe_customer_id])

  /**
   * Get stripe account to populate page
   */
  const getStripeAccount = async () => {
    try {
      setLoading(true)
      setError(null)
      const { customer, error: customerError } = await post(`${API_URL}/stripe/customer`, {
        stripe_customer_id: stripe_customer_id,
      })
      if (customerError) throw customerError
      setCustomer(customer)

      const { taxIds, error: taxIdsError } = await post(`${API_URL}/stripe/tax-ids`, {
        stripe_customer_id: stripe_customer_id,
      })
      if (taxIdsError) throw taxIdsError
      setTaxIds(taxIds)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get Stripe account: ${error.message}`,
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentMethods = async () => {
    try {
      setIsLoadingPaymentMethods(true)
      const { data: paymentMethods, error } = await get(`${API_URL}/organizations/${slug}/payments`)
      if (error) throw error
      setPaymentMethods(paymentMethods)
      setIsLoadingPaymentMethods(false)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get organization payment methods: ${error.message}`,
      })
    }
  }

  /**
   * Get a link and then redirect them
   * path is used to determine what path inside billing portal to redirect to
   */
  const redirectToPortal = async (path: any) => {
    try {
      setLoading(true)
      let { billingPortal } = await post(`${API_URL}/stripe/billing`, {
        stripe_customer_id,
        returnTo: `${getURL()}${router.asPath}`,
      })
      window.location.replace(billingPortal + (path ? path : null))
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Failed to redirect: ${error.message}` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <article className="my-4 container max-w-4xl space-y-8">
      {organization.aws_marketplace ? (
        <AWSMarketplaceSubscription organization={organization} />
      ) : (
        <>
          <div className="space-y-8">
            <ProjectsSummary projects={projects} />
            <CreditBalance balance={balance} isCredit={isCredit} isDebt={isDebt} />
            <PaymentMethods
              loading={loading || isLoadingPaymentMethods}
              defaultPaymentMethod={defaultPaymentMethod}
              paymentMethods={paymentMethods || []}
              onDefaultMethodUpdated={() => getStripeAccount()}
              onPaymentMethodsDeleted={() => getPaymentMethods()}
            />
            <BillingAddress
              loading={loading}
              address={stripe_customer_object?.address ?? {}}
              redirectToPortal={redirectToPortal}
            />
            <TaxID
              loading={loading}
              taxIds={taxIds?.data ?? []}
              redirectToPortal={redirectToPortal}
            />
          </div>
        </>
      )}
    </article>
  )
}

export default BillingSettings
