import { cn } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

import PaymentMethods from '../../Billing/Payment/PaymentMethods/PaymentMethods'
import { InvoicesSection } from '../InvoicesSettings/InvoicesSection'
import BillingBreakdown from './BillingBreakdown/BillingBreakdown'
import { BillingCustomerData } from './BillingCustomerData/BillingCustomerData'
import BillingEmail from './BillingEmail'
import { CostControl } from './CostControl/CostControl'
import CreditBalance from './CreditBalance'
import Subscription from './Subscription/Subscription'
import { ScaffoldDivider } from '@/components/layouts/Scaffold'
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
      <PageHeader>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Billing</PageHeaderTitle>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>

      <PageContainer id="subscription" className={cn('[&>div]:pt-0!')}>
        <Subscription />
      </PageContainer>

      <ScaffoldDivider />

      <PageContainer id="cost-control">
        <CostControl />
      </PageContainer>

      <ScaffoldDivider />

      {org && org.plan.id !== 'free' && (
        <PageContainer id="breakdown">
          <BillingBreakdown />
        </PageContainer>
      )}

      {isBillingInvoicesEnabledOnProfileLevel && (
        <>
          <ScaffoldDivider />
          <PageContainer id="invoices">
            <InvoicesSection />
          </PageContainer>
        </>
      )}

      {billingPaymentMethodsEnabled && (
        <>
          <ScaffoldDivider />

          <PageContainer id="payment-methods">
            <PaymentMethods />
          </PageContainer>
        </>
      )}

      {isBillingCreditsEnabledOnProfileLevel && (
        <>
          <ScaffoldDivider />

          <PageContainer id="credits-balance">
            <CreditBalance />
          </PageContainer>
        </>
      )}

      {billingAccountDataEnabled && (
        <>
          <ScaffoldDivider />

          <PageContainer id="email">
            <BillingEmail />
          </PageContainer>

          <ScaffoldDivider />

          <PageContainer id="address">
            <BillingCustomerData />
          </PageContainer>
        </>
      )}
    </>
  )
}
