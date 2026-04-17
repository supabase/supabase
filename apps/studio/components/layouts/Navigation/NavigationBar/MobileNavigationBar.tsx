import { useParams } from 'common'
import { ChevronLeft, Menu, Search } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button, cn } from 'ui'
import { CommandMenuTrigger, MobileSheetNav } from 'ui-patterns'

import { HeaderUpgradeButton } from '../LayoutHeader/HeaderUpgradeButton'
import { HomeIcon } from '../LayoutHeader/HomeIcon'
import { useMobileSheet } from './MobileSheetContext'
import { OrgSelector } from './OrgSelector'
import { ProjectBranchSelector } from './ProjectBranchSelector'
import { useIsFloatingMobileToolbarEnabled } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { ConnectButton } from '@/components/interfaces/ConnectButton/ConnectButton'
import { LocalDropdown } from '@/components/interfaces/LocalDropdown'
import { SidebarContent } from '@/components/interfaces/Sidebar'
import { UserDropdown } from '@/components/interfaces/UserDropdown'
import { FloatingMobileToolbar } from '@/components/layouts/Navigation/FloatingMobileToolbar/FloatingMobileToolbar'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'

export const ICON_SIZE = 20
export const ICON_STROKE_WIDTH = 1.5

const MobileNavigationBar = ({
  hideMobileMenu,
  backToDashboardURL,
}: {
  hideMobileMenu?: boolean
  backToDashboardURL?: string
}) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const showFloatingMobileToolbar = useIsFloatingMobileToolbarEnabled()
  const { ref: projectRef, slug } = useParams()
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const { isPending: isLoadingOrganizations } = useOrganizationsQuery()
  const isProjectScope = !!projectRef
  const showOrgSelection = slug || isLoadingOrganizations || (selectedOrganization && projectRef)
  const { openMenu } = useMobileSheet()

  return (
    <div className="w-full flex flex-row md:hidden">
      <nav
        className={cn(
          'group pr-3 pl-2 z-10 w-full h-12 gap-2',
          'border-b bg-dash-sidebar border-default shadow-[0_0_30px_0_rgba(0,0,0,0.07)]',
          'transition-width duration-200',
          'hide-scrollbar flex flex-row items-center justify-between overflow-x-auto'
        )}
      >
        <div className={cn('flex min-w-0 flex-shrink items-center gap-2', !IS_PLATFORM && 'pl-2')}>
          {showFloatingMobileToolbar && backToDashboardURL && (
            <div className="flex items-center justify-center ml-1 flex-0 md:hidden h-full aspect-square">
              <Link
                href={backToDashboardURL}
                className="flex items-center justify-center !bg-transparent rounded-md min-w-[30px] w-[30px] h-[30px] border text-foreground-lighter hover:text-foreground transition-colors"
              >
                <ChevronLeft strokeWidth={1.5} size={16} />
              </Link>
            </div>
          )}
          {!IS_PLATFORM && <HomeIcon />}
          {isProjectScope ? (
            <>
              <ProjectBranchSelector />
              <ConnectButton className="[&_span]:hidden h-8 w-8" />
            </>
          ) : IS_PLATFORM && showOrgSelection ? (
            <OrgSelector />
          ) : (
            <HomeIcon className="ml-1" />
          )}
        </div>
        <div className="flex flex-shrink-0 gap-2">
          {!showFloatingMobileToolbar && (
            <CommandMenuTrigger>
              <button
                type="button"
                className={cn(
                  'group',
                  'flex-grow h-[30px] rounded-md',
                  'p-2',
                  'flex items-center justify-between',
                  'bg-transparent border-none text-foreground-lighter',
                  'hover:bg-opacity-100 hover:border-strong hover:text-foreground-light',
                  'focus-visible:!outline-4 focus-visible:outline-offset-1 focus-visible:outline-brand-600',
                  'transition'
                )}
              >
                <Search size={18} strokeWidth={2} />
              </button>
            </CommandMenuTrigger>
          )}
          {IS_PLATFORM && <HeaderUpgradeButton />}
          {IS_PLATFORM ? <UserDropdown /> : <LocalDropdown />}
          {!hideMobileMenu && (
            <Button
              title="Menu dropdown button"
              type="default"
              className="flex lg:hidden border-default bg-surface-100/75 text-foreground-light rounded-md min-w-[30px] w-[30px] h-[30px] data-[state=open]:bg-overlay-hover/30"
              icon={<Menu />}
              onClick={() => openMenu()}
            />
          )}
        </div>
      </nav>
      <MobileSheetNav open={isSheetOpen} onOpenChange={setIsSheetOpen} data-state="expanded">
        <SidebarContent />
      </MobileSheetNav>
      {showFloatingMobileToolbar && <FloatingMobileToolbar hideMobileMenu={hideMobileMenu} />}
    </div>
  )
}

export default MobileNavigationBar
