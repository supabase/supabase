import { FC } from 'react'
import { groupBy } from 'lodash'
import { Modal } from 'ui'

interface Props {
  visible: boolean
  totalDue: number
  billingDate: Date
  costBreakdown: any[]
  onCancel: () => void
}

const CostBreakdownModal: FC<Props> = ({
  visible,
  totalDue,
  billingDate,
  costBreakdown,
  onCancel,
}) => {
  const groupedBreakdown = groupBy(costBreakdown, 'period.start')

  return (
    <Modal
      hideFooter
      visible={visible}
      size="xlarge"
      header="Cost breakdown details"
      onCancel={onCancel}
    >
      <div className="space-y-2 py-4">
        <Modal.Content>
          <p className="text-sm">
            The following shows the cost breakdown of the invoice that will be billed on{' '}
            {billingDate.toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            .
          </p>
        </Modal.Content>
        <Modal.Content>
          <div className="rounded border border-scale-600 bg-scale-500">
            <div className="flex items-center border-b border-scale-600 py-2 px-4">
              <div className="w-[75%] text-xs">Description</div>
              <div className="w-[10%] text-right text-xs">Qty</div>
              <div className="w-[15%] text-right text-xs">Amount</div>
            </div>
            {Object.keys(groupedBreakdown).map((startPeriod: any, idx: number) => {
              const start = new Date(Number(startPeriod) * 1000).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
              const end = new Date(
                groupedBreakdown[startPeriod][0].period.end * 1000
              ).toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
              return (
                <div key={`breakdown-${idx}`} className="border-b border-scale-600">
                  <div className="flex items-center py-2 px-4 ">
                    <div className="w-full text-xs text-scale-1100">
                      {start} - {end}
                    </div>
                  </div>
                  {groupedBreakdown[startPeriod].map((item: any, index: number) => {
                    return (
                      <div key={`breakdown-row-${index}`} className="flex items-center py-2 px-4">
                        <div className="w-[75%] text-sm">{item.description}</div>
                        <div className="w-[10%] text-right text-sm">{item.quantity}</div>
                        <div className="w-[15%] text-right text-sm">
                          ${(item.amount / 100).toFixed(2)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            <div className="flex flex-col space-y-1 py-2 px-4">
              <div className="flex items-center">
                <div className="w-[75%] text-sm">Total amount</div>
                <div className="w-[10%] text-right text-sm"></div>
                <div className="w-[15%] text-right text-xl">
                  ${totalDue < 0 ? 0 : totalDue.toFixed(2)}
                </div>
              </div>
              {totalDue < 0 && (
                <div className="flex items-center text-scale-1100">
                  <div className="w-[75%] text-sm">
                    Amount returned as credits for unused resources
                  </div>
                  <div className="w-[10%] text-right text-sm"></div>
                  <div className="w-[15%] text-right text-sm">${Math.abs(totalDue).toFixed(2)}</div>
                </div>
              )}
            </div>
          </div>
        </Modal.Content>
      </div>
    </Modal>
  )
}

export default CostBreakdownModal
