import { Badge } from 'ui'

interface CreditBalanceProps {
  balance: string | number
  isCredit: boolean
  isDebt: boolean
}

const CreditBalance = ({ balance, isCredit, isDebt }: CreditBalanceProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <div className="flex items-center space-x-2">
          <h4>Credit balance</h4>
          {isCredit && <Badge>You have credits available</Badge>}
          {isDebt && <Badge color="red">Outstanding payments</Badge>}
        </div>
        <p className="text-sm opacity-50">Charges will be deducted from your balance first</p>
      </div>
      <div className="flex items-end space-x-1">
        {isDebt && <h4 className="opacity-50">-</h4>}
        <h4 className="opacity-50">$</h4>
        <h2 className="text-4xl">{balance}</h2>
        {isCredit && <h4 className="opacity-50">/credits</h4>}
      </div>
    </div>
  )
}

export default CreditBalance
