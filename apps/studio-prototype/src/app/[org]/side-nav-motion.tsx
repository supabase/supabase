'use client'

import { motion } from 'framer-motion'
import { cn } from 'ui'

export default function SideNavMotion({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ x: -48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ ease: 'easeInOut', duration: 0.15, delay: 0.5 }}
      className={cn(
        'w-16 bg-dash-sidebar border-r flex flex-col py-[10px]',
        // 'hover:w-32 px-5',
        'items-center',
        'transition-all'
      )}
    >
      {children}
    </motion.div>
  )
}
