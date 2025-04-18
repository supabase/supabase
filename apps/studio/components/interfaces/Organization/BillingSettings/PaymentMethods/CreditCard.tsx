import { MoreHorizontal } from 'lucide-react'

import { DropdownMenuItemTooltip } from 'components/ui/DropdownMenuItemTooltip'
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
import { PlanId } from 'data/subscriptions/types'

interface CreditCardProps {
  paymentMethod: OrganizationPaymentMethod
  canUpdatePaymentMethods?: boolean
  paymentMethodType?: string
  paymentMethodCount: number
  subscriptionPlan?: PlanId
  setSelectedMethodForUse?: (paymentMethod: OrganizationPaymentMethod) => void
  setSelectedMethodToDelete?: (paymentMethod: OrganizationPaymentMethod) => void
}

const CreditCard = ({
  paymentMethod,
  canUpdatePaymentMethods = true,
  paymentMethodType,
  subscriptionPlan,
  paymentMethodCount,
  setSelectedMethodForUse,
  setSelectedMethodToDelete,
}: CreditCardProps) => {
  const isActive = paymentMethod.is_default
  const isRemovable =
    !paymentMethod.is_default || (subscriptionPlan === 'free' && paymentMethodCount === 1)

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

        {canUpdatePaymentMethods && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="outline"
                className="hover:border-muted px-1"
                icon={<MoreHorizontal />}
                aria-label="More options"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              {paymentMethodType === 'card' && !isActive && (
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
              <DropdownMenuItemTooltip
                key="delete-method"
                disabled={!isRemovable}
                className="!pointer-events-auto"
                onClick={() => setSelectedMethodToDelete?.(paymentMethod)}
                tooltip={{
                  content: {
                    side: 'left',
                    text: !isRemovable
                      ? 'Unable to delete a card that is currently active'
                      : undefined,
                  },
                }}
              >
                <p>Delete card</p>
              </DropdownMenuItemTooltip>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  )
}

export default CreditCard
