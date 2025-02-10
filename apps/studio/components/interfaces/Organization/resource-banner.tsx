import { useParams } from 'common'
import { MAX_WIDTH_CLASSES, PADDING_CLASSES } from 'components/layouts/Scaffold'
import { AnimatePresence, motion } from 'framer-motion'
import { useOrganizationRestrictions } from 'hooks/misc/useOrganizationRestrictions'
import Link from 'next/link'
import { cn, CriticalIcon, WarningIcon } from 'ui'

const bannerMotionProps = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
  transition: { duration: 0.2, delay: 0.5 },
} as const

const containerMotionProps = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
} as const

export function OrganizationResourceBanner({ headerBanner }: { headerBanner?: boolean }) {
  const { warnings } = useOrganizationRestrictions()

  return (
    <AnimatePresence initial={false}>
      {warnings.map((warning, i) => (
        <HeaderBanner key={i} {...warning} headerBanner={headerBanner} />
      ))}
    </AnimatePresence>
  )
}

export const HeaderBanner = ({
  type,
  title,
  message,
  link,
  headerBanner,
}: {
  type: 'danger' | 'warning' | 'note' | 'incident'
  title: string
  message: string
  link?: string
  headerBanner?: boolean
}) => {
  // const { ref: isProject } = useParams()

  const bannerStyles =
    type === 'danger'
      ? 'bg-destructive-300 dark:bg-destructive-200'
      : type === 'incident'
        ? 'bg-brand-400'
        : 'bg-warning-300 dark:bg-warning-200'
  const Icon = type === 'danger' ? CriticalIcon : WarningIcon

  return (
    <motion.div
      {...bannerMotionProps}
      className={cn(
        `relative ${bannerStyles} border-b border-muted py-1 flex items-center justify-center flex-shrink-0 px-0`,
        // headerBanner && 'last:rounded-b-[7px] mx-2 border-default border-l border-r',
        type === 'incident' && 'hover:bg-brand-300',
        'flex-shrink-0'
      )}
    >
      <div className={cn('items-center flex flex-row gap-3')}>
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
        <Icon
          className={cn('z-[1] flex-shrink-0', type === 'incident' && 'bg-brand text-brand-200')}
        />
        <div className="flex flex-col md:flex-row gap-0 md:gap-3">
          <span
            className={cn(
              'text-xs sm:text-sm z-[1]',
              type === 'danger'
                ? 'text-destructive'
                : type === 'incident'
                  ? 'text-foreground'
                  : 'text-warning'
            )}
          >
            {title}
          </span>
          <span
            className={cn(
              'text-xs sm:text-sm z-[1] opacity-75',
              type === 'danger'
                ? 'text-destructive'
                : type === 'incident'
                  ? 'text-foreground'
                  : 'text-warning'
            )}
          >
            {message}
          </span>
        </div>
        {link && (
          <button
            className={cn(
              'lg:block hidden',
              'text-foreground-lighter text-sm z-[1] m-0',
              type === 'danger' ? 'text-destructive' : 'text-warning'
            )}
          >
            <Link href={link}>View Details</Link>
          </button>
        )}
      </div>
    </motion.div>
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
