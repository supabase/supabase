import { AnimatePresence, motion } from 'framer-motion'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { Box, Boxes, CornerLeftUp } from 'lucide-react'
import { useSidebar } from 'ui'
import { SidebarOpenButton } from './sidebar-open-button'
import { useRouter } from 'next/router'
import OrganizationDropdown from 'components/layouts/AppLayout/OrganizationDropdown'
import ProjectDropdown from 'components/layouts/AppLayout/ProjectDropdown'
import { FeedbackDropdown } from 'components/layouts/ProjectLayout/LayoutHeader/FeedbackDropdown'
import NotificationsPopoverV2 from 'components/layouts/ProjectLayout/LayoutHeader/NotificationsPopoverV2/NotificationsPopover'
import HelpPopover from 'components/layouts/ProjectLayout/LayoutHeader/HelpPopover'
import { UserDropdown } from './user-dropdown'
import { IS_PLATFORM } from 'lib/constants'

export function SidebarOpenTopBanner() {
  const { state, setOpen, open } = useSidebar()
  const router = useRouter()
  const project = useSelectedProject()
  const org = useSelectedOrganization()

  return (
    <AnimatePresence>
      {state === 'collapsed' && (
        <motion.div
          initial={{ opacity: 0, x: -20, height: 0 }}
          animate={{
            opacity: 1,
            x: 0,
            height: 'auto',
            transition: { duration: 0.22, delay: 0.4 },
          }}
          exit={{
            opacity: 0,
            x: 20,
            height: 0,
            transition: { duration: 0.05 },
          }}
          style={{
            paddingLeft: open ? '16px' : '8px',
            paddingRight: open ? '16px' : '8px',
          }}
          className="relative items-center flex w-full gap-5 pt-[6px] pb-[1px]"
        >
          {/* <SidebarOpenButton /> */}
          <AnimatePresence>
            {project && (
              <motion.button
                onClick={() => router.push(`/org/${org?.slug}`)}
                className="group/org-back-button text-foreground-lighter flex items-center gap-1 hover:text-foreground text-xs cursor-pointer"
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: 20, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <CornerLeftUp
                  size={14}
                  strokeWidth={1}
                  className="text-forefground-lighter group-hover/org-back-button:text-foreground group-hover/org-back-button:translate-y-[-2px] transition-transform"
                />
                Organization
              </motion.button>
            )}
          </AnimatePresence>
          <div className="flex items-center gap-2">
            <OrganizationDropdown />
            {/* <Boxes className="text-foreground-lighter" size={14} strokeWidth={1} />
              <span className="text-[12px] text-foreground-light"> {org?.name}</span> */}
          </div>
          {project && (
            <div className="flex items-center gap-2">
              <ProjectDropdown />
            </div>
          )}
          <div className="flex items-center gap-x-2">
            {IS_PLATFORM && (
              <>
                <FeedbackDropdown />
                <NotificationsPopoverV2 />
                <HelpPopover />
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
