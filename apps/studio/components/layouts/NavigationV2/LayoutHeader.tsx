import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import dayjs from 'dayjs'
import { DevToolbarTrigger } from 'dev-tools'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import type { ReactNode } from 'react'
import { Badge, cn } from 'ui'
import { CommandMenuTriggerInput } from 'ui-patterns'

import {
  useIsBranching2Enabled,
  useIsFloatingMobileToolbarEnabled,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ConnectButton } from '@/components/interfaces/ConnectButton/ConnectButton'
import { ConnectSheet } from '@/components/interfaces/ConnectSheet/ConnectSheet'
import { LocalDropdown } from '@/components/interfaces/LocalDropdown'
import { UserDropdown } from '@/components/interfaces/UserDropdown'
import { BreadcrumbsView } from '@/components/layouts/Navigation/LayoutHeader/BreadcrumbsView'
import { FeedbackDropdown } from '@/components/layouts/Navigation/LayoutHeader/FeedbackDropdown/FeedbackDropdown'
import { HeaderUpgradeButton } from '@/components/layouts/Navigation/LayoutHeader/HeaderUpgradeButton'
import { HomeIcon } from '@/components/layouts/Navigation/LayoutHeader/HomeIcon'
import { LayoutHeaderDivider } from '@/components/layouts/Navigation/LayoutHeader/LayoutHeader'
import { LocalVersionPopover } from '@/components/layouts/Navigation/LayoutHeader/LocalVersionPopover'
import { MergeRequestButton } from '@/components/layouts/Navigation/LayoutHeader/MergeRequestButton'
import { useHideSidebar } from '@/hooks/misc/useHideSidebar'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useOrgUsageExceedingLimits } from '@/hooks/misc/useOrgUsageExceedingLimits'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'

interface LayoutHeaderProps {
  customHeaderComponents?: ReactNode
  breadcrumbs?: unknown[]
  headerTitle?: string
  backToDashboardURL?: string
}

export const LayoutHeader = ({
  customHeaderComponents,
  breadcrumbs = [],
  headerTitle,
  backToDashboardURL,
}: LayoutHeaderProps) => {
  const router = useRouter()
  const hideSidebar = useHideSidebar()
  const { ref: projectRef } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { data: selectedProject } = useSelectedProjectQuery()
  const gitlessBranching = useIsBranching2Enabled()
  const showFloatingMobileToolbar = useIsFloatingMobileToolbarEnabled()
  const [commandMenuEnabled] = useLocalStorageQuery(LOCAL_STORAGE_KEYS.HOTKEY_COMMAND_MENU, true)
  const { exceedingLimits } = useOrgUsageExceedingLimits(selectedOrganization)

  const isAccountPage = router.pathname.startsWith('/account')

  const isNewProject =
    selectedProject?.inserted_at !== undefined &&
    dayjs(selectedProject.inserted_at).isAfter(dayjs().subtract(5, 'day'))

  const connectButtonType = isNewProject ? 'primary' : 'default'

  return (
    <>
      <header
        className={cn(
          'flex h-11 md:h-12 items-center flex-shrink-0 border-b',
          showFloatingMobileToolbar && 'hidden md:flex'
        )}
      >
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
        <div
          className={cn(
            'flex items-center justify-between h-full px-1 pl-3 flex-1 overflow-x-auto gap-x-4'
          )}
        >
          <div className="hidden md:flex items-center justify-start text-sm gap-x-2 md:w-1/3">
            {hideSidebar && <HomeIcon />}
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

            <AnimatePresence>
              {projectRef && (
                <motion.div
                  className="items-center gap-x-2 flex"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{
                    duration: 0.15,
                    ease: 'easeOut',
                  }}
                >
                  <ConnectButton buttonType={connectButtonType} />
                  {IS_PLATFORM && gitlessBranching && <MergeRequestButton />}
                </motion.div>
              )}
            </AnimatePresence>
            <BreadcrumbsView defaultValue={breadcrumbs} />

            {exceedingLimits && (
              <div className="ml-2">
                <Link href={`/org/${selectedOrganization?.slug}/usage`}>
                  <Badge variant="destructive">Exceeding usage limits</Badge>
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center w-full max-w-60 xl:max-w-60 justify-center">
            <CommandMenuTriggerInput
              showShortcut={commandMenuEnabled}
              placeholder="Search..."
              className={cn(
                'flex !min-w-60 w-full rounded-full bg-transparent border-strong',
                '[&_.command-shortcut>div]:border-none',
                '[&_.command-shortcut>div]:pr-2',
                '[&_.command-shortcut>div]:bg-transparent',
                '[&_.command-shortcut>div]:text-foreground-lighter'
              )}
            />
          </div>
          <div className="flex items-center justify-end gap-x-1 md:w-1/3">
            {customHeaderComponents && customHeaderComponents}
            {IS_PLATFORM ? (
              <>
                <DevToolbarTrigger />
                <FeedbackDropdown />
                <HeaderUpgradeButton className="hidden md:flex" />
                <UserDropdown triggerClassName="hidden md:flex" />
              </>
            ) : (
              <>
                <LocalVersionPopover />
                <LocalDropdown triggerClassName="hidden md:flex" />
              </>
            )}
          </div>
        </div>
      </header>

      <ConnectSheet />
    </>
  )
}
