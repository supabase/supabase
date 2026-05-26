import { cn } from 'ui'

import PaymentMethods from '../../Billing/Payment/PaymentMethods/PaymentMethods'
import { InvoicesSection } from '../InvoicesSettings/InvoicesSection'
import BillingBreakdown from './BillingBreakdown/BillingBreakdown'
import { BillingCustomerData } from './BillingCustomerData/BillingCustomerData'
import BillingEmail from './BillingEmail'
import CostControl from './CostControl/CostControl'
import CreditBalance from './CreditBalance'
import Subscription from './Subscription/Subscription'
import {
  ScaffoldContainer,
  ScaffoldContainerLegacy,
  ScaffoldDivider,
  ScaffoldTitle,
} from '@/components/layouts/Scaffold'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

export const BillingSettings = () => {
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

  const { data: org } = useSelectedOrganizationQuery()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const isNotOrgWithPartnerBilling = !subscription?.billing_via_partner
  const isStripeOrg = org?.managed_by === MANAGED_BY.STRIPE_PROJECTS

  const billingAccountDataEnabled =
    isBillingAccountDataEnabledOnProfileLevel && isNotOrgWithPartnerBilling
  const billingPaymentMethodsEnabled =
    isBillingPaymentMethodsEnabledOnProfileLevel && (isNotOrgWithPartnerBilling || isStripeOrg)

  return (
    <>
      <ScaffoldContainerLegacy>
        <ScaffoldTitle>Billing</ScaffoldTitle>
      </ScaffoldContainerLegacy>

      <ScaffoldContainer id="subscription" className={cn('[&>div]:pt-0!')}>
        <Subscription />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer id="cost-control">
        <CostControl />
      </ScaffoldContainer>

      <ScaffoldDivider />

      {org && org.plan.id !== 'free' && (
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
            <BillingCustomerData />
          </ScaffoldContainer>
        </>
      )}
    </>
  )
}
