import { PlusIcon } from 'lucide-react'
import { useId } from 'react'
import { Badge, cn, RadioGroup, RadioGroupItem } from 'ui'

import { getCardExpiry, getCardTitle } from './PlanUpdatePayment.utils'
import { CardBrandIcon } from '@/components/interfaces/Billing/Payment/PaymentMethods/CreditCard'
import type { OrganizationPaymentMethod } from '@/data/organizations/organization-payment-methods-query'

/** Value of the "Add a new card" row; saved cards use their payment method id. */
export const NEW_PAYMENT_METHOD_VALUE = 'new'

interface PaymentMethodRadioListProps {
  label: string
  paymentMethods: OrganizationPaymentMethod[]
  /** A saved payment method id, or `NEW_PAYMENT_METHOD_VALUE`. */
  value: string | undefined
  disabled?: boolean
  onValueChange: (value: string) => void
}

const Row = ({
  id,
  value,
  isSelected,
  children,
}: {
  id: string
  value: string
  isSelected: boolean
  children: React.ReactNode
}) => (
  <label
    htmlFor={id}
    className={cn(
      'relative flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors',
      'hover:bg-surface-200',
      isSelected && 'bg-selection hover:bg-selection'
    )}
  >
    {isSelected && (
      <span className="absolute inset-y-0 left-0 w-0.5 bg-foreground-muted" aria-hidden="true" />
    )}
    <RadioGroupItem id={id} value={value} className="shrink-0 border-foreground-lighter" />
    {children}
  </label>
)

/**
 * Saved cards as a radio list, with "Add a new card" as the last option. Only rendered
 * for an organization that already has a card on file; without one the new card form
 * opens directly instead.
 */
export const PaymentMethodRadioList = ({
  label,
  paymentMethods,
  value,
  disabled,
  onValueChange,
}: PaymentMethodRadioListProps) => {
  const labelId = useId()
  const idPrefix = useId()

  return (
    <div>
      <p id={labelId} className="mb-2 text-sm text-foreground-light">
        {label}
      </p>

      <RadioGroup
        aria-labelledby={labelId}
        // Empty rather than undefined: the saved card is only auto-selected after first
        // render, and Radix warns when a group goes from uncontrolled to controlled.
        value={value ?? ''}
        disabled={disabled}
        onValueChange={onValueChange}
        className="gap-0 divide-y overflow-hidden rounded-md border bg-surface-100"
      >
        {paymentMethods.map((method) => {
          const expiry = getCardExpiry(method.card)

          return (
            <Row
              key={method.id}
              id={`${idPrefix}-${method.id}`}
              value={method.id}
              isSelected={value === method.id}
            >
              <span aria-hidden="true" className="flex shrink-0">
                <CardBrandIcon brand={method.card?.brand} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base text-foreground" translate="no">
                  {getCardTitle(method.card)}
                </p>
                {expiry && (
                  <p className="text-sm text-foreground-light" translate="no">
                    Expires {expiry}
                  </p>
                )}
              </div>
              {method.is_default && <Badge>Default</Badge>}
            </Row>
          )
        })}

        <Row
          id={`${idPrefix}-${NEW_PAYMENT_METHOD_VALUE}`}
          value={NEW_PAYMENT_METHOD_VALUE}
          isSelected={value === NEW_PAYMENT_METHOD_VALUE}
        >
          <span
            className="flex h-6 w-8 shrink-0 items-center justify-center rounded-sm border border-dashed border-foreground-muted text-foreground-light"
            aria-hidden="true"
          >
            <PlusIcon size={14} />
          </span>
          <p className="text-base text-foreground">Add a new card</p>
        </Row>
      </RadioGroup>
    </div>
  )
}
