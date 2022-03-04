import Divider from 'components/ui/Divider'
import { FC } from 'react'

interface Props {}

const PaymentSummaryPanel: FC<Props> = ({}) => {
  return (
    <div
      className="bg-scale-300 w-full px-20 py-10 space-y-8"
      style={{ height: 'calc(100vh - 49.5px)' }}
    >
      <p>Payment Summary</p>
      <div className="space-y-1">
        <p className="text-sm">Selected subscription</p>
      </div>
      <div className="space-y-1">
        <p className="text-sm">Selected add-ons</p>
      </div>
      <div className="h-px w-full bg-scale-600"></div>
      <div className="flex items-start justify-between space-x-16">
        <div className="space-y-1">
          <p>Amount due immediately</p>
          <p className="text-sm text-scale-1100">
            Your next invoice of $25 + usage fees will be charged on the 1st February 2022
          </p>
        </div>
        <div className="flex justify-end items-end">
          <p className="text-scale-1100 relative -top-[1px]">$</p>
          <p className="text-2xl">0</p>
        </div>
      </div>
    </div>
  )
}

export default PaymentSummaryPanel
