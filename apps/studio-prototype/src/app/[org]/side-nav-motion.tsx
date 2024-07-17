'use client'

import { motion, useAnimation, AnimationControls } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { createContext, useContext, useEffect, useState } from 'react'
import { cn } from 'ui'

interface HoverContextProps {
  isHovered: boolean
  setIsHovered: React.Dispatch<React.SetStateAction<boolean>>
  controls: AnimationControls
}

const HoverContext = createContext<HoverContextProps | undefined>(undefined)

export const useHoverControls = (): HoverContextProps => {
  const context = useContext(HoverContext)
  if (!context) {
    throw new Error('useHoverControls must be used within a HoverProvider')
  }
  return context
}

export default function SideNavMotion({ children }: { children: React.ReactNode }) {
  const pathName = usePathname()
  const controls = useAnimation()
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    controls.start({
      x: 0,
      opacity: 1,
      transition: { ease: 'easeInOut', duration: 0.15, delay: 0.1 },
    })
  }, [controls])

  const handleHoverStart = () => {
    setIsHovered(true)
    controls.start('hover')
  }

  const handleHoverEnd = () => {
    setIsHovered(false)
    controls.start('rest')
  }

  return (
    <motion.div
      initial={{ x: -48, opacity: 0, width: 64, position: 'fixed' }}
      // animate={{ x: 0, opacity: 1 }}
      animate={controls}
      transition={{ ease: 'easeInOut', duration: 0.05, delay: 0.1 }}
      whileHover={{
        width: 256,
      }}
      onHoverStart={handleHoverStart}
      onHoverEnd={handleHoverEnd}
      className={cn(
        !pathName.startsWith('/new') && 'h-full bg-dash-sidebar border-r',
        'flex flex-col py-[10px]',
        'items-center',
        'transition-all',
        'z-10',
        'overlay-hidden'
      )}
      // whileHover={{ width: 256, position: 'fixed' }}
    >
      <HoverContext.Provider value={{ isHovered, setIsHovered, controls }}>
        {!pathName.startsWith('/new') && children}
      </HoverContext.Provider>
    </motion.div>
  )
}
