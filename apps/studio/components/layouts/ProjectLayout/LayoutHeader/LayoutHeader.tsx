import { useParams } from 'common'
import Connect from 'components/interfaces/Connect/Connect'
import { UserDropdown } from 'components/interfaces/user-dropdown'
import AssistantButton from 'components/layouts/AppLayout/AssistantButton'
import BranchDropdown from 'components/layouts/AppLayout/BranchDropdown'
import EnableBranchingButton from 'components/layouts/AppLayout/EnableBranchingButton/EnableBranchingButton'
import OrganizationDropdown from 'components/layouts/AppLayout/OrganizationDropdown'
import ProjectDropdown from 'components/layouts/AppLayout/ProjectDropdown'
import { getResourcesExceededLimitsOrg } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { Badge, cn } from 'ui'
import BreadcrumbsView from './BreadcrumbsView'
import { FeedbackDropdown } from './FeedbackDropdown'
import HelpPopover from './HelpPopover'
import NotificationsPopoverV2 from './NotificationsPopoverV2/NotificationsPopover'
import { useAppStateSnapshot } from 'state/app-state'

const LayoutHeaderDivider = () => (
  <span className="text-border-stronger">
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      shapeRendering="geometricPrecision"
    >
      <path d="M16 3.549L7.12 20.600" />
    </svg>
  </span>
)

const LayoutHeader = ({ customHeaderComponents, breadcrumbs = [], headerBorder = true }: any) => {
  const { ref: projectRef } = useParams()
  const router = useRouter()
  const selectedProject = useSelectedProject()
  const selectedOrganization = useSelectedOrganization()
  const isBranchingEnabled = selectedProject?.is_branch_enabled === true
  const isOrgPage = router.pathname.startsWith('/org/') // Add this check
  const { aiAssistantPanel } = useAppStateSnapshot()

  const connectDialogUpdate = useFlag('connectDialogUpdate')

  const { data: subscription } = useOrgSubscriptionQuery({
    orgSlug: selectedOrganization?.slug,
  })

  // We only want to query the org usage and check for possible over-ages for plans without usage billing enabled (free or pro with spend cap)
  const { data: orgUsage } = useOrgUsageQuery(
    { orgSlug: selectedOrganization?.slug },
    { enabled: subscription?.usage_billing_enabled === false }
  )

  const exceedingLimits = useMemo(() => {
    if (orgUsage) {
      return getResourcesExceededLimitsOrg(orgUsage?.usages || []).length > 0
    } else {
      return false
    }
  }, [orgUsage])

  const isProjects = router.asPath.includes('/project/')

  return (
    <>
      <header className={cn('flex h-12 max-h-12 min-h-12 items-center flex-shrink-0')}>
        <div className={cn('flex items-center justify-between py-2 px-3 flex-1', 'pl-5')}>
          <div className="flex items-center text-sm">
            <Link
              href={IS_PLATFORM ? `/org/${selectedOrganization?.slug}` : `/project/${projectRef}`}
              className="flex items-center justify-center"
            >
              <Image
                alt="Supabase"
                src={`${router.basePath}/img/supabase-logo.svg`}
                width={18}
                height={18}
                className="w-[18px] h-[18px]"
              />
            </Link>

            <>
              <div className="flex items-center pl-2">
                <LayoutHeaderDivider />
                <OrganizationDropdown />
                <AnimatePresence>
                  {projectRef && (
                    <motion.div
                      className="flex items-center"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{
                        duration: 0.15,
                        ease: 'easeOut',
                      }}
                    >
                      <LayoutHeaderDivider />
                      <ProjectDropdown />

                      {exceedingLimits && (
                        <div className="ml-2">
                          <Link href={`/org/${selectedOrganization?.slug}/usage`}>
                            <Badge variant="destructive">Exceeding usage limits</Badge>
                          </Link>
                        </div>
                      )}

                      {selectedProject && isBranchingEnabled && (
                        <>
                          <LayoutHeaderDivider />
                          <BranchDropdown />
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {projectRef && (
                  <motion.div
                    className="ml-3 flex items-center gap-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeOut',
                    }}
                  >
                    {connectDialogUpdate && <Connect />}
                    {!isBranchingEnabled && <EnableBranchingButton />}
                  </motion.div>
                )}
              </AnimatePresence>
            </>

            {/* Additional breadcrumbs are supplied */}
            <BreadcrumbsView defaultValue={breadcrumbs} />
          </div>
          <div className="flex items-center gap-x-2">
            {customHeaderComponents && customHeaderComponents}
            {IS_PLATFORM && (
              <>
                <FeedbackDropdown />
                <NotificationsPopoverV2 />
                <HelpPopover />
                <UserDropdown />
              </>
            )}
          </div>
        </div>
        {!!projectRef && (
          <motion.div
            className="border-l flex-0 h-full"
            initial={{ opacity: 0, x: -20 }}
            animate={{
              opacity: !aiAssistantPanel.open ? 1 : 0,
              x: !aiAssistantPanel.open ? 0 : -20,
              width: aiAssistantPanel.open ? 0 : 'auto',
            }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              duration: 0.15,
              ease: 'easeOut',
            }}
          >
            <AssistantButton />
          </motion.div>
        )}
      </header>
      {/* {!isOrgPage && (
        <motion.div
          layoutId="layout-header-bottom-border"
          className="bg-border h-px w-full"
          initial={true}
        />
      )} */}
    </>
  )
}
export default LayoutHeader
