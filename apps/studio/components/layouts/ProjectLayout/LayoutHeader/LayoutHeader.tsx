import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import {
  useIsBranching2Enabled,
  useIsSidebarToolbarEnabled,
} from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { LocalDropdown } from 'components/interfaces/LocalDropdown'
import { UserDropdown } from 'components/interfaces/UserDropdown'
import { AdvisorButton } from 'components/layouts/AppLayout/AdvisorButton'
import { AssistantButton } from 'components/layouts/AppLayout/AssistantButton'
import { BranchDropdown } from 'components/layouts/AppLayout/BranchDropdown'
import { InlineEditorButton } from 'components/layouts/AppLayout/InlineEditorButton'
import { OrganizationDropdown } from 'components/layouts/AppLayout/OrganizationDropdown'
import { ProjectDropdown } from 'components/layouts/AppLayout/ProjectDropdown'
import { getResourcesExceededLimitsOrg } from 'components/ui/OveragesBanner/OveragesBanner.utils'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { ReactNode, useMemo } from 'react'
import { useAppStateSnapshot } from 'state/app-state'
import { Badge, cn } from 'ui'
import { CommandMenuTriggerInput } from 'ui-patterns'
import { DevToolbarTrigger } from 'dev-tools'
import { BreadcrumbsView } from './BreadcrumbsView'
import { FeedbackDropdown } from './FeedbackDropdown/FeedbackDropdown'
import { HelpPopover } from './HelpPopover'
import { HomeIcon } from './HomeIcon'
import { LocalVersionPopover } from './LocalVersionPopover'
import MergeRequestButton from './MergeRequestButton'
import { Connect } from '@/components/interfaces/Connect/Connect'
import { ConnectButton } from '@/components/interfaces/ConnectButton/ConnectButton'
import { ConnectSheet } from '@/components/interfaces/ConnectSheet/ConnectSheet'
import { usePHFlag } from '@/hooks/ui/useFlag'

const LayoutHeaderDivider = ({ className, ...props }: React.HTMLProps<HTMLSpanElement>) => (
  <span className={cn('text-border-stronger pr-2', className)} {...props}>
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

interface LayoutHeaderProps {
  customHeaderComponents?: ReactNode
  breadcrumbs?: any[]
  headerTitle?: string
  showProductMenu?: boolean
  backToDashboardURL?: string
}

export const LayoutHeader = ({
  customHeaderComponents,
  breadcrumbs = [],
  headerTitle,
  showProductMenu,
  backToDashboardURL,
}: LayoutHeaderProps) => {
  const router = useRouter()
  const { ref: projectRef, slug } = useParams()
  const { data: selectedProject } = useSelectedProjectQuery()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { setMobileMenuOpen } = useAppStateSnapshot()
  const gitlessBranching = useIsBranching2Enabled()

  const showSidebarToolbar = useIsSidebarToolbarEnabled()
  const connectSheetFlag = usePHFlag<string | boolean>('connectSheet')
  const isFlagResolved = connectSheetFlag !== undefined
  const isConnectSheetEnabled = connectSheetFlag === true || connectSheetFlag === 'variation'

  const [commandMenuEnabled] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.HOTKEY_COMMAND_MENU, true)

  const isAccountPage = router.pathname.startsWith('/account')

  // We only want to query the org usage and check for possible over-ages for plans without usage billing enabled (free or pro with spend cap)
  const { data: orgUsage } = useOrgUsageQuery(
    { orgSlug: selectedOrganization?.slug },
    { enabled: selectedOrganization?.usage_billing_enabled === false }
  )

  const exceedingLimits = useMemo(() => {
    if (orgUsage) {
      return getResourcesExceededLimitsOrg(orgUsage?.usages || []).length > 0
    } else {
      return false
    }
  }, [orgUsage])

  // show org selection if we are on a project page or on a explicit org route
  const showOrgSelection = slug || (selectedOrganization && projectRef)

  return (
    <>
      <header className={cn('flex h-12 items-center flex-shrink-0 border-b')}>
        {backToDashboardURL && isAccountPage && (
          <div className="flex items-center justify-center border-r flex-0 md:hidden h-full aspect-square">
            <Link
              href={backToDashboardURL}
              className="flex items-center justify-center border-none !bg-transparent rounded-md min-w-[30px] w-[30px] h-[30px] text-foreground-lighter hover:text-foreground transition-colors"
            >
              <ChevronLeft strokeWidth={1.5} size={16} />
            </Link>
          </div>
        )}
        {(showProductMenu || isAccountPage) && (
          <div className="flex items-center justify-center border-r flex-0 md:hidden h-full aspect-square">
            <button
              title="Menu dropdown button"
              className={cn(
                'group/view-toggle ml-4 flex justify-center flex-col border-none space-x-0 items-start gap-1 !bg-transparent rounded-md min-w-[30px] w-[30px] h-[30px]'
              )}
              onClick={() => setMobileMenuOpen(true)}
            >
              <div className="h-px inline-block left-0 w-4 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
              <div className="h-px inline-block left-0 w-3 transition-all ease-out bg-foreground-lighter group-hover/view-toggle:bg-foreground p-0 m-0" />
            </button>
          </div>
        )}
        <div
          className={cn(
            'flex items-center justify-between h-full pr-3 flex-1 overflow-x-auto gap-x-8 pl-4',
            showSidebarToolbar && 'pr-1.5'
          )}
        >
          <div className="flex items-center text-sm">
            <HomeIcon />
            <div className="flex items-center md:pl-2">
              {showOrgSelection && IS_PLATFORM ? (
                <>
                  <LayoutHeaderDivider className="hidden md:block" />
                  <OrganizationDropdown />
                </>
              ) : null}
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

                    {selectedProject && (
                      <>
                        <LayoutHeaderDivider />
                        {IS_PLATFORM && <BranchDropdown />}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {headerTitle && (
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
                    <span className="text-foreground">{headerTitle}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {projectRef && (
                <motion.div
                  className="ml-3 items-center gap-x-2 flex"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    duration: 0.15,
                    ease: 'easeOut',
                  }}
                >
                  {IS_PLATFORM && gitlessBranching && <MergeRequestButton />}
                  <ConnectButton />
                </motion.div>
              )}
            </AnimatePresence>
            <BreadcrumbsView defaultValue={breadcrumbs} />
          </div>
          <div className="flex items-center gap-x-2">
            {customHeaderComponents && customHeaderComponents}
            {IS_PLATFORM ? (
              <>
                <DevToolbarTrigger />
                <FeedbackDropdown />

                <div className="flex items-center gap-2">
                  <CommandMenuTriggerInput
                    showShortcut={commandMenuEnabled}
                    placeholder="Search..."
                    className={cn(
                      'hidden md:flex md:min-w-32 xl:min-w-32 rounded-full bg-transparent',
                      '[&_.command-shortcut>div]:border-none',
                      '[&_.command-shortcut>div]:pr-2',
                      '[&_.command-shortcut>div]:bg-transparent',
                      '[&_.command-shortcut>div]:text-foreground-lighter'
                    )}
                  />
                  {!showSidebarToolbar && (
                    <>
                      <HelpPopover />
                      <AdvisorButton projectRef={projectRef} />
                      <AnimatePresence initial={false}>
                        {!!projectRef && (
                          <>
                            <InlineEditorButton />
                            <AssistantButton />
                          </>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
                <UserDropdown />
              </>
            ) : (
              <>
                <LocalVersionPopover />
                <div className="flex items-center gap-2">
                  <CommandMenuTriggerInput
                    placeholder="Search..."
                    className="hidden md:flex md:min-w-32 xl:min-w-32 rounded-full bg-transparent
                        [&_.command-shortcut>div]:border-none
                        [&_.command-shortcut>div]:pr-2
                        [&_.command-shortcut>div]:bg-transparent
                        [&_.command-shortcut>div]:text-foreground-lighter
                      "
                  />
                  {!showSidebarToolbar && (
                    <>
                      <HelpPopover />
                      <AdvisorButton projectRef={projectRef} />
                      <AnimatePresence initial={false}>
                        {!!projectRef && (
                          <>
                            <InlineEditorButton />
                            <AssistantButton />
                          </>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>
                <LocalDropdown />
              </>
            )}
          </div>
        </div>
      </header>

      {isFlagResolved && isConnectSheetEnabled ? <ConnectSheet /> : <Connect />}
    </>
  )
}
