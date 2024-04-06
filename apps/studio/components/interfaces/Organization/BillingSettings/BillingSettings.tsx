import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import { useIsFeatureEnabled } from 'hooks'
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
    billingAccountData: billingAccountDataEnabled,
    billingPaymentMethods: billingPaymentMethodsEnabled,
    billingCredits: billingCreditsEnabled,
  } = useIsFeatureEnabled(['billing:account_data', 'billing:payment_methods', 'billing:credits'])

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

      <ScaffoldContainer id="breakdown">
        <BillingBreakdown />
      </ScaffoldContainer>

      {billingCreditsEnabled && (
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
