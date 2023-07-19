import { useEffect, useState } from 'react'

import { useParams } from 'common/hooks'
import { useProjectsQuery } from 'data/projects/projects-query'
import { useCheckPermissions, useFlag, useSelectedOrganization, useStore } from 'hooks'
import { PermissionAction } from '@supabase/shared-types/out/constants'
import { get } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import BillingAddress from './BillingAddress/BillingAddress'
import BillingEmail from './BillingEmail'
import CreditBalance from './CreditBalance'
import PaymentMethods from './PaymentMethods'
import ProjectsSummary from './ProjectsSummary'
import TaxID from './TaxID/TaxID'
import OrganizationBillingMigrationPanel from '../GeneralSettings/OrganizationBillingMigrationPanel'
import { ScaffoldContainer, ScaffoldContainerLegacy } from 'components/layouts/Scaffold'

const BillingSettings = () => {
  const { ui } = useStore()
  const { slug } = useParams()

  const organization = useSelectedOrganization()
  const { data: allProjects } = useProjectsQuery()
  const projects =
    allProjects?.filter((project) => project.organization_id === organization?.id) ?? []

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

  const orgBillingMigrationEnabled = useFlag('orgBillingMigration')
  const canMigrateOrganization = useCheckPermissions(PermissionAction.UPDATE, 'organizations')
  const selectedOrganization = useSelectedOrganization()
  const { subscription_id } = selectedOrganization ?? {}

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

  useEffect(() => {
    getCustomerProfile()
    getPaymentMethods()
    getTaxIds()
  }, [slug])

  return (
    <ScaffoldContainerLegacy>
      {orgBillingMigrationEnabled && canMigrateOrganization && !subscription_id && (
        <OrganizationBillingMigrationPanel />
      )}
      <ProjectsSummary projects={projects} />
      <CreditBalance balance={balance} isCredit={isCredit} isDebt={isDebt} />
      <PaymentMethods
        loading={isLoadingCustomer || isLoadingPaymentMethods}
        defaultPaymentMethod={defaultPaymentMethod}
        paymentMethods={paymentMethods || []}
        onDefaultMethodUpdated={setCustomer}
        onPaymentMethodsDeleted={() => getPaymentMethods()}
        onPaymentMethodAdded={() => getPaymentMethods()}
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
    </ScaffoldContainerLegacy>
  )
}

export default BillingSettings
