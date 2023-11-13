import * as Tooltip from '@radix-ui/react-tooltip'
import { Badge } from 'ui'

import { InvoiceStatus } from './Invoices.types'

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus
}

export const invoiceStatusMapping: Record<InvoiceStatus, { label: string; badgeColor: string }> = {
  [InvoiceStatus.DRAFT]: {
    label: 'Upcoming',
    badgeColor: 'yellow',
  },
  [InvoiceStatus.PAID]: {
    label: 'Paid',
    badgeColor: 'green',
  },
  [InvoiceStatus.VOID]: {
    label: 'Forgiven',
    badgeColor: 'green',
  },

  // We do not want to overcomplicate it for the user, so we'll treat uncollectible/open the same from a user perspective
  // it's an outstanding invoice
  [InvoiceStatus.UNCOLLECTIBLE]: {
    label: 'Outstanding',
    badgeColor: 'red',
  },
  [InvoiceStatus.OPEN]: {
    label: 'Outstanding',
    badgeColor: 'red',
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
          // @ts-ignore
          color={statusMapping?.badgeColor || 'gray'}
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
