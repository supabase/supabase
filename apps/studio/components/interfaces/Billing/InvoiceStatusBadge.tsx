import * as Tooltip from '@radix-ui/react-tooltip'
import { Badge } from 'ui'

import { InvoiceStatus } from './Invoices.types'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
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

const InvoiceStatusBadge = ({ status }: InvoiceStatusBadgeProps) => {
  const statusMapping = invoiceStatusMapping[status]

  return (
    <Tooltip.Root delayDuration={0}>
      <Tooltip.Trigger>
        <Badge
          size="small"
          className="capitalize"
          variant={statusMapping?.badgeVariant || 'default'}
        >
          {statusMapping?.label || status}
        </Badge>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content side="bottom">
          <Tooltip.Arrow className="radix-tooltip-arrow" />
          <div
            className={[
              'rounded bg-alternative py-1 px-2 leading-none shadow',
              'w-[300px] space-y-2 border border-background',
            ].join(' ')}
          >
            {[InvoiceStatus.OPEN, InvoiceStatus.UNCOLLECTIBLE].includes(status) && (
              <p className="text-xs text-foreground">
                We were not able to collect the money. Make sure you have a valid payment method and
                enough funds. Outstanding invoices may cause restrictions. You can manually pay the
                using the "Pay Now" button.
              </p>
            )}

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
          </div>
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}

export default InvoiceStatusBadge
