import { MoreHorizontal } from 'lucide-react'

import { OrganizationPaymentMethod } from 'data/organizations/organization-payment-methods-query'
import { BASE_PATH } from 'lib/constants'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

interface CreditCardProps {
  paymentMethod: OrganizationPaymentMethod
  canUpdatePaymentMethods?: boolean
  paymentMethodType?: string
  setSelectedMethodForUse?: (paymentMethod: OrganizationPaymentMethod) => void
  setSelectedMethodToDelete?: (paymentMethod: OrganizationPaymentMethod) => void
}

const CreditCard = ({
  paymentMethod,
  canUpdatePaymentMethods = true,
  paymentMethodType,
  setSelectedMethodForUse,
  setSelectedMethodToDelete,
}: CreditCardProps) => {
  const isActive = paymentMethod.is_default

  const expiryYear = paymentMethod.card?.exp_year ?? 0
  const expiryMonth = paymentMethod.card?.exp_month ?? 0

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const isExpiringSoon = expiryYear === currentYear && expiryMonth === currentMonth
  const isExpired =
    expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)

  if (!paymentMethod.card) return null

  return (
    <div key={paymentMethod.id} className="flex items-center justify-between gap-8">
      <div className="flex items-center gap-8">
        <img
          alt="Credit card brand"
          src={`${BASE_PATH}/img/payment-methods/${paymentMethod.card.brand
            .replace(' ', '-')
            .toLowerCase()}.png`}
          width="32"
        />
        <p className="prose text-sm font-mono">**** **** **** {paymentMethod.card!.last4}</p>
        <p className="text-sm tabular-nums">
          Expires: {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {isExpiringSoon && <Badge variant="warning">Expiring soon</Badge>}
        {isExpired && <Badge variant="destructive">Expired</Badge>}
        {isActive && <Badge variant="brand">Active</Badge>}

        {canUpdatePaymentMethods && !isActive && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="outline"
                className="hover:border-muted px-1"
                icon={<MoreHorizontal />}
                aria-label="More options"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {paymentMethodType === 'card' && (
                <>
                  <DropdownMenuItem
                    key="make-default"
                    onClick={() => setSelectedMethodForUse?.(paymentMethod)}
                  >
                    <p>Use this card</p>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                key="delete-method"
                onClick={() => setSelectedMethodToDelete?.(paymentMethod)}
              >
                <p>Delete card</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export default CreditCard
