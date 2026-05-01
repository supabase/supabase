import { MoreHorizontal } from 'lucide-react'
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import PartnerIcon from '@/components/ui/PartnerIcon'
import type { OrganizationPaymentMethod } from '@/data/organizations/organization-payment-methods-query'
import type { PlanId } from '@/data/subscriptions/types'
import { BASE_PATH } from '@/lib/constants'
import { MANAGED_BY } from '@/lib/constants/infrastructure'

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
  const isSpt = paymentMethod.type === 'shared_payment_token'
  const spt = paymentMethod.shared_payment_token
  const isActive = paymentMethod.is_default
  const isRemovable =
    !paymentMethod.is_default || (subscriptionPlan === 'free' && paymentMethodCount === 1)

  const expiryYear = paymentMethod.card?.exp_year ?? 0
  const expiryMonth = paymentMethod.card?.exp_month ?? 0

  const currentMonth = new Date().getMonth() + 1
  const currentYear = new Date().getFullYear()

  const isCardExpiringSoon = expiryYear === currentYear && expiryMonth === currentMonth
  const isCardExpired =
    expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)
  const isTokenExpired = spt?.is_expired ?? false
  const tokenExpiry = spt?.expires_at
    ? `${new Date(spt.expires_at * 1000).getMonth() + 1}/${new Date(spt.expires_at * 1000).getFullYear()}`
    : undefined

  const stripeStatus = (() => {
    if (!isSpt) return null
    if (isTokenExpired) {
      return {
        label: 'Token expired',
        variant: 'destructive' as const,
        description: 'Stripe Projects token has expired',
      }
    }
    if (isCardExpired) {
      return {
        label: 'Needs review',
        variant: 'warning' as const,
        description: 'Underlying card has expired',
      }
    }
    if (isCardExpiringSoon) {
      return {
        label: 'Needs review',
        variant: 'warning' as const,
        description: 'Underlying card expires soon',
      }
    }
    return {
      label: 'Active',
      variant: 'success' as const,
      description: 'Stripe Projects token is active',
    }
  })()

  if (!paymentMethod.card) return null

  return (
    <div key={paymentMethod.id} className="space-y-3">
      <div className="flex items-center justify-between gap-8">
        <div className="flex items-center gap-8">
          <div className="relative shrink-0">
            <img
              alt="Credit card brand"
              src={`${BASE_PATH}/img/payment-methods/${paymentMethod.card.brand
                .replace(' ', '-')
                .toLowerCase()}.png`}
              width="32"
            />
            {isSpt && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="absolute -bottom-1.5 -right-2 rounded-md bg-background outline outline-2 outline-background">
                    <PartnerIcon
                      organization={{ managed_by: MANAGED_BY.STRIPE_PROJECTS }}
                      showTooltip={false}
                      size="small"
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top">Handled via Stripe Projects</TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-8">
              <p className="prose text-sm font-mono">**** **** **** {paymentMethod.card.last4}</p>
              <p className="text-sm tabular-nums">
                Expires: {paymentMethod.card.exp_month}/{paymentMethod.card.exp_year}
              </p>
            </div>
            {isSpt && spt && (
              <div className="mt-2.5 flex items-center gap-2 border-t border-border-light pt-2.5 text-xs text-foreground-light">
                <p className="m-0">
                  Managed via Stripe Projects · Token ending in{' '}
                  <code className="text-code-inline">{spt.last4}</code>
                  {tokenExpiry && <span> · Expires {tokenExpiry}</span>}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isSpt && isCardExpiringSoon && <Badge variant="warning">Expiring soon</Badge>}
          {!isSpt && isCardExpired && <Badge variant="destructive">Expired</Badge>}
          {!isSpt && !isCardExpired && isActive && <Badge variant="success">Active</Badge>}
          {stripeStatus && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Badge variant={stripeStatus.variant}>{stripeStatus.label}</Badge>
                </span>
              </TooltipTrigger>
              <TooltipContent side="left">{stripeStatus.description}</TooltipContent>
            </Tooltip>
          )}

          {canUpdatePaymentMethods && !isSpt && (
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
                  className="pointer-events-auto!"
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
    </div>
  )
}

export default CreditCard
