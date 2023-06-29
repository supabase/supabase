import CostControl from './CostControl/CostControl'
import Subscription from './Subscription/Subscription'

const BillingSettingsV2 = () => {
  return (
    <>
      <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
        <Subscription />
      </div>
      <div className="border-b" />
      <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
        <CostControl />
      </div>
      <div className="border-b" />
    </>
  )
}

export default BillingSettingsV2
