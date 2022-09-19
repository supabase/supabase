import { FC } from 'react'
import { Badge } from 'ui'

interface Props {
  item: string
  amount: number | string
  unitPrice: number | string
  price: number | string
  freeQuota?: number
}

const CostBreakdownRow: FC<Props> = ({ item, amount, unitPrice, price, freeQuota }) => {
  return (
    <div className="relative flex items-center border-t border-panel-border-light px-6 py-3 dark:border-panel-border-dark">
      <div className="flex w-[40%] items-center gap-3">
        <span className="text-sm">{item}</span>
        {freeQuota && (
          <Badge color="scale">
            <span className="text-xs text-scale-900">{`${freeQuota / 1000000000}GB included`}</span>
          </Badge>
        )}
      </div>
      <div className="flex w-[20%] justify-end">
        <span className="text-sm">{amount}</span>
      </div>
      <div className="flex w-[20%] justify-end">
        <span className="text-sm">${unitPrice}</span>
      </div>
      <div className="flex w-[20%] justify-end">
        <span className="text-sm">${price}</span>
      </div>
    </div>
  )
}

export default CostBreakdownRow
