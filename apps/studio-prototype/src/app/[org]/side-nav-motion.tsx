'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { cn } from 'ui'

export default function SideNavMotion({ children }: { children: React.ReactNode }) {
  const pathName = usePathname()

  return (
    <motion.div
      initial={{ x: -48, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ ease: 'easeInOut', duration: 0.15, delay: 0.5 }}
      className={cn(
        !pathName.startsWith('/new') && 'w-16 min-w-16 bg-dash-sidebar border-r',
        'flex flex-col py-[10px]',
        'items-center',
        'transition-all'
      )}
    >
      {!pathName.startsWith('/new') && children}
    </motion.div>
  )
}
