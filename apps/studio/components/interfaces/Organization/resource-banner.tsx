import { useParams } from 'common'
import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'
import { useResourceWarningsQuery } from 'data/usage/resource-warnings-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import Link from 'next/link'
import { Button, cn, CriticalIcon, WarningIcon } from 'ui'
import dayjs from 'dayjs'

export function OrganizationResourceBanner() {
  const { data: resourceWarnings } = useResourceWarningsQuery()
  const { data: overdueInvoices } = useOverdueInvoicesQuery()
  const org = useSelectedOrganization()

  return (
    <>
      {!!overdueInvoices?.length && (
        <WarningBanner
          type="danger"
          title="Outstanding Invoices"
          message="Please pay invoices to avoid service disruption."
          link={`/org/${org?.slug}/settings/invoices`}
          org={org}
        />
      )}
      {org?.restriction_status === 'grace_period' && (
        <WarningBanner
          type="warning"
          title="Your organization has exceeded its quota"
          message={`You are given a grace period until ${dayjs(org?.restriction_data?.['grace_period_end']).format('DD MMM, YYYY')}`}
          link={`/org/${org?.slug}/settings/billing`}
          org={org}
        />
      )}
      {org?.restriction_status === 'grace_period_over' && (
        <WarningBanner
          type="warning"
          title="Grace period is over"
          message="Your project will not be able to serve requests when you used up your quota."
          link={`/org/${org?.slug}/settings/billing`}
          org={org}
        />
      )}
      {org?.restriction_status === 'restricted' && (
        <WarningBanner
          type="danger"
          title="Services Restricted"
          message="Your project is unable to serve any requests as your organization has used up its quota."
          link={`/org/${org?.slug}/settings/billing`}
          org={org}
        />
      )}
    </>
  )
}

const WarningBanner = ({
  type,
  title,
  message,
  link,
  org,
}: {
  type: string
  title: string
  message: string
  link: string
  org: any
}) => {
  const { ref: isProject } = useParams()

  const bannerStyles =
    type === 'danger'
      ? 'bg-destructive-300 dark:bg-destructive-200'
      : 'bg-warning-300 dark:bg-warning-200'
  const Icon = type === 'danger' ? CriticalIcon : WarningIcon

  return (
    <div
      className={cn(
        `relative ${bannerStyles} border-b border-muted py-1 flex items-center gap-2 flex-shrink-0 px-10 justify-center`,
        isProject && 'last:rounded-b-[7px] mx-2 border-default border-l border-r',
        'flex-shrink-0'
      )}
    >
      <div className="mx-auto w-full xl:max-w-[700px] items-center flex flex-row gap-3">
        <div className="absolute inset-y-0 left-0 right-0 overflow-hidden z-0">
          <div
            className="absolute inset-0 opacity-[0.8%]"
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
        <Icon className="z-[1] flex-shrink-0" />
        <span
          className={`${type === 'danger' ? 'text-destructive' : 'text-warning'} text-sm z-[1]`}
        >
          {title}
        </span>
        <span
          className={`${type === 'danger' ? 'text-destructive' : 'text-warning'} text-sm opacity-75 z-[1] flex-grow`}
        >
          {message}
        </span>
        <button
          className={cn(
            'text-foreground-lighter text-sm z-[1] m-0',
            type === 'danger' ? 'text-destructive' : 'text-warning'
          )}
        >
          <Link href={link}>View Details</Link>
        </button>
      </div>
    </div>
  )
}

// import dayjs from 'dayjs'
// import Link from 'next/link'

// import { useOrganizationsQuery } from 'data/organizations/organizations-query'
// import { useSelectedProject } from 'hooks/misc/useSelectedProject'
// import { AlertTitle_Shadcn_, Alert_Shadcn_, Button, CriticalIcon, WarningIcon } from 'ui'

// /**
//  * Shown on projects in organization which are above their qouta
//  */
// export const RestrictionBanner = () => {
//   const project = useSelectedProject()
//   const { data } = useOrganizationsQuery()
//   const currentOrg = data?.find((org) => org.id === project?.organization_id)

//   if (!currentOrg?.restriction_status) return null

//   return (
//     <Alert_Shadcn_
//       variant={currentOrg.restriction_status === 'restricted' ? 'destructive' : 'warning'}
//       className="rounded-none border-l-0 border-r-0 h-[44px] p-0 flex items-center justify-center"
//     >
//       <AlertTitle_Shadcn_ className="flex items-center gap-x-4">
//         {currentOrg.restriction_status === 'restricted' ? <CriticalIcon /> : <WarningIcon />}
//         <span>
//           {currentOrg.restriction_status === 'grace_period' &&
//             `Your organization has exceeded its quota. You are given a grace period until ${dayjs(currentOrg.restriction_data['grace_period_end']).format('DD MMM, YYYY')}`}
//           {currentOrg.restriction_status === 'grace_period_over' &&
//             `Your grace period is over and your project will not be able to serve requests when you used up your quota.`}
//           {currentOrg.restriction_status === 'restricted' &&
//             'Your project is unable to serve any requests as your organization has used up its quota.'}
//         </span>
//         <Button asChild type="default">
//           <Link href={`/org/${currentOrg.slug}/billing`}>More information</Link>
//         </Button>
//       </AlertTitle_Shadcn_>
//     </Alert_Shadcn_>
//   )
// }
