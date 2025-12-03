'use client'
import { motion } from 'framer-motion'
import { cn } from 'ui'

export const HighlightedText = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <span className={cn('relative', className)}>
      <motion.span
        className={cn('absolute bg-brand origin-left w-full h-full')}
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ type: 'spring', duration: 0.42, bounce: 0.15 }}
      />
      <span className="relative z-5 px-8">{children}</span>
    </span>
  )
}
