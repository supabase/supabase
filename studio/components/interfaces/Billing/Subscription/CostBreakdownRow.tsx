import { FC } from 'react'
import { Badge, Typography } from '@supabase/ui'

interface Props {
  item: string
  amount: number | string
  unitPrice: number | string
  price: number | string
  freeQuota?: number
}

const CostBreakdownRow: FC<Props> = ({ item, amount, unitPrice, price, freeQuota }) => {
  return (
    <div className="border-panel-border-light dark:border-panel-border-dark relative flex items-center border-t px-6 py-3">
      <div className="flex w-[40%] items-center gap-3">
        <span>{item}</span>
        {freeQuota && (
          <Badge color="scale">
            <span className="text-scale-900 text-xs">{`${freeQuota / 1000000000}GB included`}</span>
          </Badge>
        )}
      </div>
      <div className="flex w-[20%] justify-end">
        <span className="text-sm">{amount}</span>
      </div>
      <div className="flex w-[20%] justify-end">
        <span>${unitPrice}</span>
      </div>
      <div className="flex w-[20%] justify-end">
        <span>${price}</span>
      </div>
    </div>
  )
}

export default CostBreakdownRow
