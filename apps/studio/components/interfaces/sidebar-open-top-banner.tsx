import { AnimatePresence, motion } from 'framer-motion'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { Box, Boxes } from 'lucide-react'
import { useSidebar } from 'ui'
import { SidebarOpenButton } from './sidebar-open-button'

export function SidebarOpenTopBanner() {
  const { state, setOpen, open } = useSidebar()
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
          className="relative items-center flex w-full h-5 mt-0.5 gap-5 px-0.5"
        >
          <div className="relative items-center flex w-full h-5 mt-0.5 gap-5 px-0.5">
            <SidebarOpenButton />
            <div className="flex items-center gap-2">
              <Boxes className="text-foreground-lighter" size={14} strokeWidth={1} />
              <span className="text-[12px] text-foreground-light"> {org?.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Box className="text-foreground-lighter" size={14} strokeWidth={1} />
              <span className="text-[12px] text-foreground-light"> {project?.name}</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
