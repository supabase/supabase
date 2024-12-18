import AssistantButton from 'components/layouts/AppLayout/AssistantButton'
import EnableBranchingButton from 'components/layouts/AppLayout/EnableBranchingButton/EnableBranchingButton'
import OrganizationDropdown from 'components/layouts/AppLayout/OrganizationDropdown'
import ProjectDropdown from 'components/layouts/AppLayout/ProjectDropdown'
import { FeedbackDropdown } from 'components/layouts/ProjectLayout/LayoutHeader/FeedbackDropdown'
import HelpPopover from 'components/layouts/ProjectLayout/LayoutHeader/HelpPopover'
import NotificationsPopoverV2 from 'components/layouts/ProjectLayout/LayoutHeader/NotificationsPopoverV2/NotificationsPopover'
import { AnimatePresence, motion } from 'framer-motion'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import { IS_PLATFORM } from 'lib/constants'
import { CornerLeftUp } from 'lucide-react'
import { useRouter } from 'next/router'
import { useAppStateSnapshot } from 'state/app-state'
import { useSidebar } from 'ui'
import Connect from './Connect/Connect'
import BranchDropdown from 'components/layouts/AppLayout/BranchDropdown'

export function SidebarOpenTopBanner() {
  const connectDialogUpdate = useFlag('connectDialogUpdate')

  const { aiAssistantPanel } = useAppStateSnapshot()
  const { state, setOpen, open } = useSidebar()
  const router = useRouter()
  const project = useSelectedProject()
  const org = useSelectedOrganization()

  const isBranchingEnabled = project?.is_branch_enabled === true

  return (
    <AnimatePresence>
      {/* {state === 'collapsed' && ( */}
      <motion.div
        // initial={{ opacity: 0, x: -20, height: 0 }}
        // animate={{
        //   opacity: 1,
        //   x: 0,
        //   height: 'auto',
        //   transition: { duration: 0.22, delay: 0.4 },
        // }}
        // exit={{
        //   opacity: 0,
        //   x: 20,
        //   height: 0,
        //   transition: { duration: 0.05 },
        // }}
        // style={{
        //   paddingLeft: open ? '16px' : '8px',
        //   paddingRight: open ? '16px' : '8px',
        // }}
        className="relative items-center flex w-full gap-5 pt-[6px] pb-[1px] px-2"
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
        <div className="flex items-center -space-x-px">
          <OrganizationDropdown />
          <AnimatePresence>
            {project && (
              <motion.div
                className="flex items-center gap-x-3"
                initial={{ opacity: 0, x: -20, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -20, width: 0 }}
                transition={{
                  duration: 0.15,
                  ease: 'easeOut',
                }}
              >
                <ProjectDropdown />
                {isBranchingEnabled && (
                  <motion.div
                    initial={{ opacity: 0, x: -20, width: 0 }}
                    animate={{ opacity: 1, x: 0, width: 'auto' }}
                    exit={{ opacity: 0, x: -20, width: 0 }}
                    transition={{
                      duration: 0.15,
                      ease: 'easeOut',
                    }}
                  >
                    <BranchDropdown />
                  </motion.div>
                )}
                {connectDialogUpdate && <Connect />}
                {!isBranchingEnabled && <EnableBranchingButton />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center gap-x-2 w-full justify-end">
          {IS_PLATFORM && (
            <>
              <FeedbackDropdown />
              <NotificationsPopoverV2 />
              <HelpPopover />
            </>
          )}
        </div>
        {!!project?.ref && (
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
      </motion.div>
      {/* )} */}
    </AnimatePresence>
  )
}
