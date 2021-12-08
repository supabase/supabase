import { FC } from 'react'
import { Typography } from '@supabase/ui'

interface Props {
  item: string
  amount: number | string
  unitPrice: number | string
  price: number | string
}

const CostBreakdownRow: FC<Props> = ({ item, amount, unitPrice, price }) => {
  return (
    <div className="px-6 py-3 relative border-t border-panel-border-light dark:border-panel-border-dark flex items-center">
      <div className="w-[40%]">
        <Typography.Text>{item}</Typography.Text>
      </div>
      <div className="w-[20%] flex justify-end">
        <Typography.Text>{amount}</Typography.Text>
      </div>
      <div className="w-[20%] flex justify-end">
        <Typography.Text>${unitPrice}</Typography.Text>
      </div>
      <div className="w-[20%] flex justify-end">
        <Typography.Text>${price}</Typography.Text>
      </div>
    </div>
  )
}

export default CostBreakdownRow
