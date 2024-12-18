import { useParams } from 'common'
import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import Link from 'next/link'
import { Button, CriticalIcon, WarningIcon } from 'ui'

export function OrganizationResourceBanner() {
  const { data: resourceWarnings } = useResourceWarningsQuery()
  const { data: overdueInvoices } = useOverdueInvoicesQuery()
  const org = useSelectedOrganization()

  return (
    <>
      {!!overdueInvoices?.length && (
        <div className="relative bg-destructive-300 dark:bg-destructive-200 border-b border-muted py-1 flex items-center justify-center gap-2 flex-shrink-0">
          <div className="absolute inset-y-0 left-0 right-0 overflow-hidden z-0">
            <div
              className="absolute inset-0 opacity-[1%]"
              style={{
                background: `repeating-linear-gradient(
                45deg,
                currentColor,
                currentColor 10px,
                transparent 10px,
                transparent 20px
              )`,
                maskImage: 'linear-gradient(to top, black, transparent)',
                WebkitMaskImage: 'linear-gradient(to top, black, transparent)',
              }}
            />
          </div>
          <CriticalIcon className="z-[1]" />
          <span className="text-destructive text-sm z-[1]">Outstanding Invoices</span>
          <span className="text-destructive text-sm opacity-75 z-[1]">
            You have outstanding invoices. Please pay them to avoid service disruption.
          </span>
          <Button asChild type="danger" className="z-[1]">
            <Link href={`/org/${org?.slug}/invoices`}>View Invoices</Link>
          </Button>
        </div>
      )}
      {org?.restriction_status === 'grace_period' && (
        <div>
          <Button asChild type="warning">
            <Link href={`/org/${org.slug}/billing`}>Grace Period</Link>
          </Button>
        </div>
      )}
      {org?.restriction_status === 'grace_period_over' && (
        <div>
          <Button asChild type="warning">
            <Link href={`/org/${org.slug}/billing`}>Grace Period Over</Link>
          </Button>
        </div>
      )}
      {org?.restriction_status === 'restricted' && (
        <div>
          <Button asChild type="danger">
            <Link href={`/org/${org.slug}/billing`}>Services Restricted</Link>
          </Button>
        </div>
      )}
    </>
  )
}
