import { Badge, Tooltip_Shadcn_, TooltipContent_Shadcn_, TooltipTrigger_Shadcn_ } from 'ui'
import { InvoiceStatus } from './Invoices.types'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
  paymentAttempted: boolean
}

const invoiceStatusMapping: Record<
  InvoiceStatus,
  { label: string; badgeVariant: React.ComponentProps<typeof Badge>['variant'] }
> = {
  [InvoiceStatus.DRAFT]: {
    label: 'Upcoming',
    badgeVariant: 'warning',
  },
  [InvoiceStatus.PAID]: {
    label: 'Paid',
    badgeVariant: 'brand',
  },
  [InvoiceStatus.VOID]: {
    label: 'Forgiven',
    badgeVariant: 'brand',
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

const InvoiceStatusBadge = ({ status, paymentAttempted }: InvoiceStatusBadgeProps) => {
  const statusMapping = invoiceStatusMapping[status]

  return (
    <Tooltip_Shadcn_>
      <TooltipTrigger_Shadcn_>
        <Badge
          size="small"
          className="capitalize"
          variant={statusMapping?.badgeVariant || 'default'}
        >
          {statusMapping?.label || status}
        </Badge>
      </TooltipTrigger_Shadcn_>
      <TooltipContent_Shadcn_ side="bottom">
        {[InvoiceStatus.OPEN, InvoiceStatus.ISSUED, InvoiceStatus.UNCOLLECTIBLE].includes(status) &&
          (paymentAttempted ? (
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

        {status === InvoiceStatus.DRAFT && (
          <p className="text-xs text-foreground">
            The invoice will soon be finalized and charged for.
          </p>
        )}

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
      </TooltipContent_Shadcn_>
    </Tooltip_Shadcn_>
  )
}

export default InvoiceStatusBadge
