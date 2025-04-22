import { useIsNewLayoutEnabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import {
  ScaffoldContainer,
  ScaffoldContainerLegacy,
  ScaffoldDivider,
  ScaffoldTitle,
} from 'components/layouts/Scaffold'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { cn } from 'ui'
import { useOrgSubscriptionQuery } from '../../../../data/subscriptions/org-subscription-query'
import InvoicesSection from '../InvoicesSettings/InvoicesSection'
import BillingAddress from './BillingAddress/BillingAddress'
import BillingBreakdown from './BillingBreakdown/BillingBreakdown'
import BillingEmail from './BillingEmail'
import CostControl from './CostControl/CostControl'
import CreditBalance from './CreditBalance'
import PaymentMethods from './PaymentMethods/PaymentMethods'
import Subscription from './Subscription/Subscription'
import TaxID from './TaxID/TaxID'

const BillingSettings = () => {
  const {
    billingAccountData: isBillingAccountDataEnabledOnProfileLevel,
    billingPaymentMethods: isBillingPaymentMethodsEnabledOnProfileLevel,
    billingCredits: isBillingCreditsEnabledOnProfileLevel,
    billingInvoices: isBillingInvoicesEnabledOnProfileLevel,
  } = useIsFeatureEnabled([
    'billing:account_data',
    'billing:payment_methods',
    'billing:credits',
    'billing:invoices',
  ])

  const newLayoutPreview = useIsNewLayoutEnabled()

  const org = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const isNotOrgWithPartnerBilling = !subscription?.billing_via_partner

  const billingAccountDataEnabled =
    isBillingAccountDataEnabledOnProfileLevel && isNotOrgWithPartnerBilling
  const billingPaymentMethodsEnabled =
    isBillingPaymentMethodsEnabledOnProfileLevel && isNotOrgWithPartnerBilling

  return (
    <>
      {newLayoutPreview && (
        <ScaffoldContainerLegacy>
          <ScaffoldTitle>Billing</ScaffoldTitle>
        </ScaffoldContainerLegacy>
      )}

      <ScaffoldContainer id="subscription" className={cn(newLayoutPreview && '[&>div]:!pt-0')}>
        <Subscription />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="cost-control">
        <CostControl />
      </ScaffoldContainer>

      <ScaffoldDivider />

      {org?.plan.id !== 'free' && (
        <ScaffoldContainer id="breakdown">
          <BillingBreakdown />
        </ScaffoldContainer>
      )}

      {isBillingInvoicesEnabledOnProfileLevel && (
        <>
          <ScaffoldDivider />
          <ScaffoldContainer id="invoices">
            <InvoicesSection />
          </ScaffoldContainer>
        </>
      )}

      {billingPaymentMethodsEnabled && (
        <>
          <ScaffoldDivider />

          <ScaffoldContainer id="payment-methods">
            <PaymentMethods />
          </ScaffoldContainer>
        </>
      )}

      {isBillingCreditsEnabledOnProfileLevel && (
        <>
          <ScaffoldDivider />

          <ScaffoldContainer id="credits-balance">
            <CreditBalance />
          </ScaffoldContainer>
        </>
      )}

      {billingAccountDataEnabled && (
        <>
          <ScaffoldDivider />

          <ScaffoldContainer id="email">
            <BillingEmail />
          </ScaffoldContainer>

          <ScaffoldDivider />

          <ScaffoldContainer id="address">
            <BillingAddress />
          </ScaffoldContainer>

          <ScaffoldDivider />

          <ScaffoldContainer id="taxId">
            <TaxID />
          </ScaffoldContainer>
        </>
      )}
    </>
  )
}

export default BillingSettings
