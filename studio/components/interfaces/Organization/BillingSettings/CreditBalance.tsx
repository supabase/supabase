import { FC } from 'react'
import { Badge, Typography } from '@supabase/ui'

interface Props {
  balance: string | number
  isCredit: boolean
  isDebt: boolean
}

const CreditBalance: FC<Props> = ({ balance, isCredit, isDebt }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <Typography.Title level={4}>Credit balance</Typography.Title>
          {isCredit && <Badge>You have credits available</Badge>}
          {isDebt && <Badge color="red">Outstanding payments</Badge>}
        </div>
        <Typography.Text type="secondary">
          Charges will be deducted from your balance first
        </Typography.Text>
      </div>
      <div className="flex items-end space-x-1">
        {isDebt && (
          <Typography.Title className="opacity-50" level={4}>
            -
          </Typography.Title>
        )}
        <Typography.Title className="opacity-50" level={4}>
          $
        </Typography.Title>
        <Typography.Title level={2}>{balance}</Typography.Title>
        {isCredit && (
          <Typography.Title className="opacity-50" level={4}>
            /credits
          </Typography.Title>
        )}
      </div>
    </div>
  )
}

export default CreditBalance
