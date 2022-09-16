import { FC } from 'react'
import { groupBy } from 'lodash'
import { Modal } from '@supabase/ui'

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
      <div className="py-4 space-y-2">
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
          <div className="bg-scale-500 border border-scale-600 rounded">
            <div className="flex items-center py-2 px-4 border-b border-scale-600">
              <div className="text-xs w-[75%]">Description</div>
              <div className="text-xs w-[10%] text-right">Qty</div>
              <div className="text-xs w-[15%] text-right">Amount</div>
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
                    <div className="text-xs w-full text-scale-1100">
                      {start} - {end}
                    </div>
                  </div>
                  {groupedBreakdown[startPeriod].map((item: any, index: number) => {
                    return (
                      <div key={`breakdown-row-${index}`} className="flex items-center py-2 px-4">
                        <div className="text-sm w-[75%]">{item.description}</div>
                        <div className="text-sm w-[10%] text-right">{item.quantity}</div>
                        <div className="text-sm w-[15%] text-right">
                          ${(item.amount / 100).toFixed(2)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
            <div className="flex flex-col py-2 px-4 space-y-1">
              <div className="flex items-center">
                <div className="text-sm w-[75%]">Total amount</div>
                <div className="text-sm w-[10%] text-right"></div>
                <div className="text-xl w-[15%] text-right">
                  ${totalDue < 0 ? 0 : totalDue.toFixed(2)}
                </div>
              </div>
              {totalDue < 0 && (
                <div className="flex items-center text-scale-1100">
                  <div className="text-sm w-[75%]">
                    Amount returned as credits for unused resources
                  </div>
                  <div className="text-sm w-[10%] text-right"></div>
                  <div className="text-sm w-[15%] text-right">${Math.abs(totalDue).toFixed(2)}</div>
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
