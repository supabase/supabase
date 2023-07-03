import BillingEmail from './BillingEmail'
import CostControl from './CostControl/CostControl'
import Subscription from './Subscription/Subscription'
import CreditBalance from './CreditBalance'
import { LayoutWrapper } from './Scaffold'
import BillingAddress from './BillingAddress/BillingAddress'
import TaxID from './TaxID/TaxID'
import PaymentMethods from './PaymentMethods/PaymentMethods'

// [Joshen TODO] Last one: payment method details management
// Either as part of the subscription plan component like project, or its own section like the old design

const BillingSettings = () => {
  return (
    <>
      <LayoutWrapper>
        <Subscription />
      </LayoutWrapper>
      <LayoutWrapper>
        <CostControl />
      </LayoutWrapper>
      <LayoutWrapper>
        <CreditBalance />
      </LayoutWrapper>
      <LayoutWrapper>
        <PaymentMethods />
      </LayoutWrapper>
      <LayoutWrapper>
        <BillingEmail />
      </LayoutWrapper>
      <LayoutWrapper>
        <BillingAddress />
      </LayoutWrapper>
      <LayoutWrapper>
        <TaxID />
      </LayoutWrapper>
    </>
  )
}

export default BillingSettings
