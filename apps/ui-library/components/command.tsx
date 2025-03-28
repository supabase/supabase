'use client'

import { motion } from 'framer-motion'
import { CommandCopyButton } from './command-copy-button'

interface CommandCopyProps {
  name: string
  highlight?: boolean
}

export function Command({ name, highlight }: CommandCopyProps) {
  const command = `npx shadcn@latest add ${
    process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'production'
      ? `https://supabase.com`
      : process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'preview'
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
        : 'http://localhost:3004'
  }${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/r/${name}.json`

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
          {command}
        </div>
        <div className="relative z-10">
          <CommandCopyButton command={command} />
        </div>
      </div>
    </>
  )
}
