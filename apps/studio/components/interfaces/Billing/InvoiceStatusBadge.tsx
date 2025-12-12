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
      <TooltipContent side="bottom" className="max-w-xs [&>p]:text-center [&>div>p]:text-center">
        {[InvoiceStatus.OPEN, InvoiceStatus.ISSUED, InvoiceStatus.UNCOLLECTIBLE].includes(status) &&
          (paymentProcessing ? (
            <div className="space-y-1">
              <p>
                While most credit card payments get processed instantly, some Indian card providers
                may take up to 72 hours to process payments. We’re still waiting for your card
                provider to process this payment.
              </p>

              <p>
                We recommend proactively{' '}
                <InlineLink href={`${DOCS_URL}/guides/platform/credits#credit-top-ups`}>
                  topping up your credits
                </InlineLink>{' '}
                to avoid this issue in the future.
              </p>
            </div>
          ) : paymentAttempted ? (
            <p>
              We were not able to collect the payment. Make sure you have a valid payment method and
              enough funds. Outstanding invoices may cause restrictions. You can manually pay the
              invoice using the “Pay now” button.
            </p>
          ) : (
            <p>
              The invoice will soon be charged for. Please make sure to pay in a timely manner,
              especially if you pay via invoice instead of card. You can pay the invoice using your
              card using the “Pay now” button.
            </p>
          ))}

        {status === InvoiceStatus.PAID && (
          <p>The invoice has been paid successfully. No further action is required on your side.</p>
        )}

        {status === InvoiceStatus.VOID && (
          <p>This invoice has been forgiven. No further action is required on your side.</p>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export default InvoiceStatusBadge
