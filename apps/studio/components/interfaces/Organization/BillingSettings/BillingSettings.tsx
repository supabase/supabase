import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useOrgSubscriptionQuery } from '../../../../data/subscriptions/org-subscription-query'
import BillingAddress from './BillingAddress/BillingAddress'
import BillingBreakdown from './BillingBreakdown/BillingBreakdown'
import BillingEmail from './BillingEmail'
import CostControl from './CostControl/CostControl'
import CreditBalance from './CreditBalance'
import PaymentMethods from './PaymentMethods/PaymentMethods'
import Subscription from './Subscription/Subscription'
import TaxID from './TaxID/TaxID'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'

const BillingSettings = () => {
  const {
    billingAccountData: isBillingAccountDataEnabledOnProfileLevel,
    billingPaymentMethods: isBillingPaymentMethodsEnabledOnProfileLevel,
    billingCredits: isBillingCreditsEnabledOnProfileLevel,
  } = useIsFeatureEnabled(['billing:account_data', 'billing:payment_methods', 'billing:credits'])

  const org = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const isNotOrgWithPartnerBilling = !subscription?.billing_via_partner

  const billingAccountDataEnabled =
    isBillingAccountDataEnabledOnProfileLevel && isNotOrgWithPartnerBilling
  const billingPaymentMethodsEnabled =
    isBillingPaymentMethodsEnabledOnProfileLevel && isNotOrgWithPartnerBilling

  return (
    <>
      <ScaffoldContainer id="subscription">
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

      {isBillingCreditsEnabledOnProfileLevel && (
        <>
          <ScaffoldDivider />

          <ScaffoldContainer id="credits-balance">
            <CreditBalance />
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
