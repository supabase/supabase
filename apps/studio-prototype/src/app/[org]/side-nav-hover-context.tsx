'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react'
import { useAnimation, AnimationControls } from 'framer-motion'
import { useConfig } from '@/src/hooks/use-config'
import { useParams, usePathname } from 'next/navigation'

interface HoverContextProps {
  isHovered: boolean
  setIsHovered: Dispatch<SetStateAction<boolean>>
  controls: AnimationControls
  sticky: boolean | undefined
}

const HoverContext = createContext<HoverContextProps | undefined>(undefined)

export const useHoverControls = (): HoverContextProps => {
  const context = useContext(HoverContext)
  if (!context) {
    throw new Error('useHoverControls must be used within a HoverProvider')
  }
  return context
}

export function HoverProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useConfig()
  const { org, project } = useParams()
  const pathName = usePathname()
  const controls = useAnimation()
  const [isHovered, setIsHovered] = useState(false)

  useEffect(() => {
    controls.start({
      x: 0,
      opacity: 1,
      transition: { ease: 'easeInOut', duration: 0.15, delay: 0.1 },
    })
  }, [controls, org, project])

  const value = { isHovered, setIsHovered, controls, sticky: config.stickySidebar }

  return <HoverContext.Provider value={value}>{children}</HoverContext.Provider>
}
