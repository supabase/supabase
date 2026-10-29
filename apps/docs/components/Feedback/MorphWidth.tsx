'use client'

import { motion } from 'motion/react'
import { useCallback, useState, type ReactNode } from 'react'

import { MORPH_TRANSITION } from './dock-morph'

interface Size {
  width: number
  height: number
}

export interface MorphWidthProps {
  children: ReactNode
}

const useElementSize = (): [(node: HTMLElement | null) => () => void, Size | null] => {
  const [size, setSize] = useState<Size | null>(null)

  const ref = useCallback((node: HTMLElement | null) => {
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.borderBoxSize?.[0]
      if (!box) return
      setSize((previous) =>
        previous?.width === box.inlineSize && previous.height === box.blockSize
          ? previous
          : { width: box.inlineSize, height: box.blockSize }
      )
    })
    if (node) observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return [ref, size]
}

export const MorphWidth = ({ children }: MorphWidthProps) => {
  const [contentRef, size] = useElementSize()

  return (
    <motion.div
      initial={false}
      animate={{ width: size?.width ?? 'auto' }}
      transition={MORPH_TRANSITION}
      className="overflow-hidden"
    >
      <div ref={contentRef} className="w-max">
        {children}
      </div>
    </motion.div>
  )
}
