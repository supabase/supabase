'use client'

import { motion } from 'framer-motion'
import { CommandCopyButton } from './command-copy-button'

interface CommandCopyProps {
  url: string
  highlight?: boolean
}

export function Command({ url, highlight }: CommandCopyProps) {
  return (
    <>
      <div className="w-full group relative flex items-center rounded-lg bg-surface-100 px-4 py-2 overflow-hidden">
        {highlight && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-l from-transparent via-white to-transparent opacity-10 z-0"
            initial={{ x: '100%' }}
            animate={{ x: '-100%' }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: 'linear',
              repeatType: 'loop',
            }}
          />
        )}
        <div className="flex-1 font-mono text-sm text-foreground relative z-10">
          <span className="mr-2 text-[#888]">$</span>
          {url}
        </div>
        <div className="relative z-10">
          <CommandCopyButton command={url} />
        </div>
      </div>
    </>
  )
}
