import { ScaffoldContainer, ScaffoldDivider } from 'components/layouts/Scaffold'
import BillingAddress from './BillingAddress/BillingAddress'
import BillingEmail from './BillingEmail'
import CostControl from './CostControl/CostControl'
import CreditBalance from './CreditBalance'
import PaymentMethods from './PaymentMethods/PaymentMethods'
import Subscription from './Subscription/Subscription'
import TaxID from './TaxID/TaxID'
import BillingBreakdown from './BillingBreakdown/BillingBreakdown'

const BillingSettings = () => {
  return (
    <>
      <ScaffoldContainer>
        <Subscription />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer>
        <CostControl />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer>
        <BillingBreakdown />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer>
        <CreditBalance />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer>
        <PaymentMethods />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer>
        <BillingEmail />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer>
        <BillingAddress />
      </ScaffoldContainer>

      <ScaffoldDivider />

      <ScaffoldContainer>
        <TaxID />
      </ScaffoldContainer>
    </>
  )
}

export default BillingSettings
