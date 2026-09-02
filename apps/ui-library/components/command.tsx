'use client'

import { motion } from 'framer-motion'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import { CommandCopyButton } from './command-copy-button'
import { useLocalStorage } from './use-local-storage'
import { getInstallCommands, type PackageManager } from '@/lib/install-command'

interface CommandCopyProps {
  name: string
  highlight?: boolean
  // For Vue, we need to use the `shadcn-vue` package instead of `shadcn`
  framework?: 'react' | 'vue'
}

const LOCAL_STORAGE_KEY = 'package-manager-copy-command'

export function Command({ name, highlight, framework = 'react' }: CommandCopyProps) {
  const [value, setValue] = useLocalStorage(LOCAL_STORAGE_KEY, 'npm')

  const commands = getInstallCommands(name, { framework })

  return (
    <Tabs value={value} onValueChange={setValue} className="w-full">
      <div className="w-full group relative rounded-lg bg-surface-200 dark:bg-surface-100 px-4 py-2 overflow-hidden">
        {highlight && (
          <motion.div
            className="absolute inset-0 bg-linear-to-l from-transparent via-[#bbb] dark:via-white to-transparent opacity-10 z-0"
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
          <TabsList className="gap-2 relative mb-2 z-10">
            {(Object.keys(commands) as PackageManager[]).map((manager) => (
              <TabsTrigger key={manager} value={manager} className="text-xs">
                {manager}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(commands) as PackageManager[]).map((manager) => (
            <TabsContent key={manager} value={manager} className="m-0">
              <div className="flex items-center">
                <div className="flex-1 font-mono text-sm text-foreground relative z-10">
                  <span className="mr-2 text-[#888] select-none">$</span>
                  {commands[manager]}
                </div>
                <div className="relative z-10">
                  <CommandCopyButton command={commands[manager]} />
                </div>
              </div>
            </TabsContent>
          ))}
        </div>
      </div>
    </Tabs>
  )
}
