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

  const [customer, setCustomer] = useState<any>(null)
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false)

  const [paymentMethods, setPaymentMethods] = useState<any>(null)
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)

  const [taxIds, setTaxIds] = useState<any>(null)
  const [isLoadingTaxIds, setIsLoadingTaxIds] = useState(false)

  const [loading, setLoading] = useState<boolean>(false)

  const { slug, stripe_customer_id } = organization

  const defaultPaymentMethod = customer?.invoice_settings?.default_payment_method ?? ''
  const customerBalance = customer && customer.balance ? customer.balance / 100 : 0
  const isCredit = customerBalance < 0
  const isDebt = customerBalance > 0
  const balance =
    isCredit && customerBalance !== 0
      ? customerBalance.toString().replace('-', '')
      : customerBalance

  useEffect(() => {
    getCustomerProfile()
    getPaymentMethods()
    getTaxIds()
  }, [slug])

  useEffect(() => {
    if (stripe_customer_id) getStripeAccount()
  }, [stripe_customer_id])

  const getStripeAccount = async () => {
    const { customer, error: customerError } = await post(`${API_URL}/stripe/customer`, {
      stripe_customer_id: stripe_customer_id,
    })
    if (customerError) throw customerError
    console.log('getStripeAccount', customer)
  }

  const getCustomerProfile = async () => {
    try {
      setIsLoadingCustomer(true)
      const customer = await get(`${API_URL}/organizations/${slug}/customer`)
      if (customer.error) throw customer.error
      setCustomer(customer)
      setIsLoadingCustomer(false)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get organization information: ${error.message}`,
      })
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

  const getTaxIds = async () => {
    try {
      setIsLoadingTaxIds(true)
      const { data: taxIds, error } = await get(`${API_URL}/organizations/${slug}/tax-ids`)
      if (error) throw error
      setTaxIds(taxIds)
      setIsLoadingTaxIds(false)
    } catch (error: any) {
      ui.setNotification({
        error,
        category: 'error',
        message: `Failed to get organization tax IDs: ${error.message}`,
      })
    }
  }

  /**
   * Get a link and then redirect them
   * path is used to determine what path inside billing portal to redirect to
   */
  const redirectToPortal = async (path: any) => {
    try {
      let { billingPortal } = await post(`${API_URL}/stripe/billing`, {
        stripe_customer_id,
        returnTo: `${getURL()}${router.asPath}`,
      })
      window.location.replace(billingPortal + (path ? path : null))
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: `Failed to redirect: ${error.message}` })
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
              loading={isLoadingCustomer || isLoadingPaymentMethods}
              defaultPaymentMethod={defaultPaymentMethod}
              paymentMethods={paymentMethods || []}
              onDefaultMethodUpdated={setCustomer}
              onPaymentMethodsDeleted={() => getPaymentMethods()}
            />
            <BillingAddress
              loading={isLoadingCustomer}
              address={customer?.address ?? {}}
              onAddressUpdated={(address: any) => setCustomer({ ...customer, address })}
            />
            <TaxID
              loading={isLoadingTaxIds}
              taxIds={taxIds || []}
              redirectToPortal={redirectToPortal}
            />
          </div>
        </>
      )}
    </article>
  )
}

export default BillingSettings
