'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'
import { CommandCopyButton } from './command-copy-button'
import { useLocalStorage } from './use-local-storage'
import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'

interface CommandCopyProps {
  name: string
  highlight?: boolean
}

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

const LOCAL_STORAGE_KEY = 'package-manager-copy-command'

export function Command({ name, highlight }: CommandCopyProps) {
  const [value, setValue] = useLocalStorage(LOCAL_STORAGE_KEY, 'npm')
  const [showCleanBranchWarning, setShowCleanBranchWarning] = useState(false)

  // only show the clean branch warning for 8 seconds
  useEffect(() => {
    if (showCleanBranchWarning) {
      const timer = setTimeout(() => {
        setShowCleanBranchWarning(false)
      }, 8000)

      return () => clearTimeout(timer)
    }
  }, [showCleanBranchWarning])

  const getBaseUrl = () => {
    if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'production') {
      return `https://supabase.com`
    } else if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'preview') {
      return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
    } else {
      return 'http://localhost:3004'
    }
  }

  const baseUrl = getBaseUrl()
  const componentPath = `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/r/${name}.json`

  const commands: Record<PackageManager, string> = {
    npm: `npx shadcn@latest add ${baseUrl}${componentPath}`,
    pnpm: `pnpm dlx shadcn@latest add ${baseUrl}${componentPath}`,
    yarn: `yarn dlx shadcn@latest add ${baseUrl}${componentPath}`,
    bun: `bunx --bun shadcn@latest add ${baseUrl}${componentPath}`,
  }

  return (
    <Tabs_Shadcn_ value={value} onValueChange={setValue} className="w-full">
      <div className="w-full group relative rounded-lg bg-surface-100 px-4 py-2 overflow-hidden">
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
        <div className="flex flex-col">
          <TabsList_Shadcn_ className="gap-2 relative mb-2 z-10">
            {(Object.keys(commands) as PackageManager[]).map((manager) => (
              <TabsTrigger_Shadcn_ key={manager} value={manager} className="text-xs">
                {manager}
              </TabsTrigger_Shadcn_>
            ))}
          </TabsList_Shadcn_>
          {showCleanBranchWarning ? (
            <div className="font-mono text-sm text-foreground bg-green-300 p-2 rounded-sm flex items-center justify-between gap-2 h-10">
              Make sure you run this command in a clean Git branch so you can preview the changes
              <Check className="h-4 w-4 text-brand-600" />
            </div>
          ) : (
            (Object.keys(commands) as PackageManager[]).map((manager) => (
              <TabsContent_Shadcn_ key={manager} value={manager} className="m-0">
                <div className="flex items-center">
                  <div className="flex-1 font-mono text-sm text-foreground relative z-10">
                    <span className="mr-2 text-[#888]">$</span>
                    {commands[manager]}
                  </div>
                  <div className="relative z-10">
                    <CommandCopyButton
                      command={commands[manager]}
                      setShowCleanBranchWarning={setShowCleanBranchWarning}
                    />
                  </div>
                </div>
              </TabsContent_Shadcn_>
            ))
          )}
        </div>
      </div>
    </Tabs_Shadcn_>
  )
}
