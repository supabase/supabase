// components/SideNavMotion.tsx

'use client'

import { motion } from 'framer-motion'
import { useConfig } from '@/src/hooks/use-config'
import { useParams, usePathname } from 'next/navigation'
import { Pin, PinOff } from 'lucide-react'
import { useHoverControls } from '@/src/app/[org]/side-nav-hover-context'
import { cn } from 'ui'

export default function SideNavMotion({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useConfig()
  const { org, project } = useParams()
  const pathName = usePathname()
  const { isHovered, setIsHovered, controls } = useHoverControls()

  const handleHoverStart = () => {
    setIsHovered(true)
    controls.start('hover')
  }

  const handleHoverEnd = () => {
    setIsHovered(false)
    controls.start('rest')
  }

  return (
    <div
      className={cn(
        'relative',
        config.stickySidebar ? '!w-[256px] !min-w-[256px]' : 'w-16',
        'h-full transition-all'
      )}
    >
      <motion.div
        key={project ? `${org}-${project}-sidebar` : `${org}-sidebar`}
        initial={{ x: -64, opacity: 0 }}
        animate={controls}
        transition={{ ease: 'easeInOut', duration: 0.02, delay: 0.1 }}
        variants={
          !config.stickySidebar
            ? {
                rest: { x: 0, opacity: 1, width: 64, position: 'fixed' },
                hover: { opacity: 1, width: 256 },
              }
            : { rest: { x: 0, opacity: 1, width: 64, position: 'fixed' } }
        }
        onHoverStart={handleHoverStart}
        onHoverEnd={handleHoverEnd}
        className={cn(
          !pathName.startsWith('/new') && 'h-full bg-dash-sidebar border-r',
          'flex flex-col py-[10px]',
          'items-center',
          'transition-all',
          'z-10',
          'overlay-hidden',
          config.stickySidebar ? '!w-[256px] !block' : 'w-16'
        )}
      >
        {!pathName.startsWith('/new') && children}

        {config.stickySidebar ? (
          <motion.div
            animate={controls}
            initial="rest"
            className="group absolute bottom-32 -right-3 bg-surface-200 p-1 rounded-full border hover:bg-surface-300 hover:border-strong"
            variants={
              !config.stickySidebar
                ? {
                    rest: { x: -8, opacity: 0 },
                    hover: { x: 0, opacity: 1 },
                  }
                : { rest: { x: 0, opacity: 1 } }
            }
          >
            <PinOff
              className="text-foreground-muted group-hover:text-foreground"
              onClick={() => setConfig({ ...config, stickySidebar: false })}
              size={16}
            />
          </motion.div>
        ) : (
          <motion.div
            animate={controls}
            initial="rest"
            className="group absolute bottom-32 -right-3 bg-surface-200 p-1 rounded-full border hover:bg-surface-300 hover:border-strong"
            variants={
              !config.stickySidebar
                ? {
                    rest: { x: -8, opacity: 0 },
                    hover: { x: 0, opacity: 1 },
                  }
                : { rest: { x: 0, opacity: 1 } }
            }
          >
            <Pin
              className="text-foreground-muted group-hover:text-foreground"
              onClick={() => setConfig({ ...config, stickySidebar: true })}
              size={16}
            />
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
