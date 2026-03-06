import { useParams } from 'common'
import { ConnectButton } from 'components/interfaces/ConnectButton/ConnectButton'
import { SidebarContent } from 'components/interfaces/Sidebar'
import { UserDropdown } from 'components/interfaces/UserDropdown'
import { IS_PLATFORM } from 'lib/constants'
import { Menu, Search } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'
import { CommandMenuTrigger, MobileSheetNav } from 'ui-patterns'

import { HomeIcon } from '../LayoutHeader/HomeIcon'
import { OrgSelector } from './OrgSelector'
import { ProjectBranchSelector } from './ProjectBranchSelector'

const MobileNavigationBar = ({ hideMobileMenu }: { hideMobileMenu?: boolean }) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { ref: projectRef } = useParams()
  const isProjectScope = !!projectRef

  return (
    <div className="w-full flex flex-row md:hidden">
      <nav
        className={cn(
          'group pr-3 pl-2 z-10 w-full h-12 gap-2',
          'border-b bg-dash-sidebar border-default shadow-xl',
          'transition-width duration-200',
          'hide-scrollbar flex flex-row items-center justify-between overflow-x-auto'
        )}
      >
        <div className={cn('flex min-w-0 flex-shrink items-center gap-2', !IS_PLATFORM && 'pl-2')}>
          {!IS_PLATFORM && <HomeIcon />}
          {isProjectScope ? (
            <>
              <ProjectBranchSelector />
              <ConnectButton className="[&_span]:hidden h-8 w-8" />
            </>
          ) : IS_PLATFORM ? (
            <OrgSelector />
          ) : null}
        </div>
        <div className="flex flex-shrink-0 gap-2">
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
              <div className="flex items-center space-x-2">
                <Search size={18} strokeWidth={2} />
              </div>
            </button>
          </CommandMenuTrigger>
          <UserDropdown />
          {!hideMobileMenu && (
            <Button
              title="Menu dropdown button"
              type="default"
              className="flex lg:hidden border-default bg-surface-100/75 text-foreground-light rounded-md min-w-[30px] w-[30px] h-[30px] data-[state=open]:bg-overlay-hover/30"
              icon={<Menu />}
              onClick={() => setIsSheetOpen(true)}
            />
          )}
        </div>
      </nav>
      <MobileSheetNav open={isSheetOpen} onOpenChange={setIsSheetOpen} data-state="expanded">
        <SidebarContent />
      </MobileSheetNav>
    </div>
  )
}

export default MobileNavigationBar
