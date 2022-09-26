import { FC, useState, useEffect } from 'react'

import { useFlag, useStore, checkPermissions } from 'hooks'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'

import ProjectsSummary from './ProjectsSummary'
import CreditBalance from './CreditBalance'
import PaymentMethods from './PaymentMethods'
import BillingAddress from './BillingAddress/BillingAddress'
import TaxID from './TaxID/TaxID'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import BillingEmail from './BillingEmail'

interface Props {
  organization: any
  projects: any[]
}

const BillingSettings: FC<Props> = ({ organization, projects = [] }) => {
  const { ui } = useStore()
  const { slug } = organization

  const [customer, setCustomer] = useState<any>(null)
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false)

  const [paymentMethods, setPaymentMethods] = useState<any>(null)
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)

  const [taxIds, setTaxIds] = useState<any>(null)
  const [isLoadingTaxIds, setIsLoadingTaxIds] = useState(false)

  const defaultPaymentMethod = customer?.invoice_settings?.default_payment_method ?? ''
  const customerBalance = customer && customer.balance ? customer.balance / 100 : 0
  const isCredit = customerBalance < 0
  const isDebt = customerBalance > 0
  const balance =
    isCredit && customerBalance !== 0
      ? customerBalance.toString().replace('-', '')
      : customerBalance

  const enablePermissions = useFlag('enablePermissions')

  const canUpdateOrganization = enablePermissions
    ? checkPermissions(PermissionAction.UPDATE, 'organizations')
    : ui.selectedOrganization?.is_owner

  const canReadBillingEmail = checkPermissions(PermissionAction.READ, 'organizations')

  useEffect(() => {
    getCustomerProfile()
    getPaymentMethods()
    getTaxIds()
  }, [slug])

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

  return (
    <article className="container my-4 max-w-4xl space-y-8">
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

        <BillingEmail />

        <BillingAddress
          loading={isLoadingCustomer}
          address={customer?.address ?? {}}
          onAddressUpdated={(address: any) => setCustomer({ ...customer, address })}
        />
        <TaxID
          loading={isLoadingTaxIds}
          taxIds={taxIds || []}
          onTaxIdsUpdated={(ids: any) => setTaxIds(ids)}
        />
      </div>
    </article>
  )
}

export default BillingSettings
