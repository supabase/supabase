import { InlineLink } from 'components/ui/InlineLink'
import { DOCS_URL } from 'lib/constants'
import { Badge, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { InvoiceStatus } from './Invoices.types'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  paymentAttempted: boolean
  paymentProcessing: boolean
}

const invoiceStatusMapping: Record<
  InvoiceStatus,
  { label: string; badgeVariant: React.ComponentProps<typeof Badge>['variant'] }
> = {
  [InvoiceStatus.PAID]: {
    label: 'Paid',
    badgeVariant: 'success',
  },
  [InvoiceStatus.VOID]: {
    label: 'Forgiven',
    badgeVariant: 'warning',
  },

  // We do not want to overcomplicate it for the user, so we'll treat uncollectible/open/issued the same from a user perspective
  // it's an outstanding invoice
  [InvoiceStatus.UNCOLLECTIBLE]: {
    label: 'Outstanding',
    badgeVariant: 'destructive',
  },
  [InvoiceStatus.OPEN]: {
    label: 'Outstanding',
    badgeVariant: 'destructive',
  },
  [InvoiceStatus.ISSUED]: {
    label: 'Outstanding',
    badgeVariant: 'destructive',
  },
}

const InvoiceStatusBadge = ({
  status,
  paymentAttempted,
  paymentProcessing,
}: InvoiceStatusBadgeProps) => {
  const statusMapping = paymentProcessing
    ? {
        label: 'Processing',
        badgeVariant: 'warning' as React.ComponentProps<typeof Badge>['variant'],
      }
    : invoiceStatusMapping[status]

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant={statusMapping?.badgeVariant || 'default'}>
          {statusMapping?.label || status}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-sm">
        {[InvoiceStatus.OPEN, InvoiceStatus.ISSUED, InvoiceStatus.UNCOLLECTIBLE].includes(status) &&
          (paymentProcessing ? (
            <div className="space-y-1">
              <p className="text-xs text-foreground">
                While most credit card payments get processed instantly, some Indian credit card
                providers may take up to 72 hours. Your card issuer has neither confirmed nor denied
                the payment and we have to wait until the card issuer processed the payment.
              </p>

              <p className="text-xs text-foreground">
                If you run into this, we recommend{' '}
                <InlineLink href={`${DOCS_URL}/guides/platform/credits#credit-top-ups`}>
                  topping up your credits
                </InlineLink>{' '}
                in advance to avoid running into this in the future.
              </p>
            </div>
          ) : paymentAttempted ? (
            <p className="text-xs text-foreground">
              We were not able to collect the payment. Make sure you have a valid payment method and
              enough funds. Outstanding invoices may cause restrictions. You can manually pay the
              invoice using the "Pay Now" button.
            </p>
          ) : (
            <p className="text-xs text-foreground">
              The invoice will soon be charged for. In case you pay via invoice instead of card,
              please make sure to make the payment in a timely manner. You can also pay the invoice
              using your card now using the "Pay Now" button.
            </p>
          ))}

        {status === InvoiceStatus.PAID && (
          <p className="text-xs text-foreground">
            The invoice has been paid successfully. No action is required on your side.
          </p>
        )}

        {status === InvoiceStatus.VOID && (
          <p className="text-xs text-foreground">
            This invoice has been forgiven. No action is required on your side.
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export default InvoiceStatusBadge
