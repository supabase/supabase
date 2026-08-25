'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { cn, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import { CommandCopyButton } from './command-copy-button'
import { useLocalStorage } from './use-local-storage'
import {
  buildBlockInstallPrompt,
  getInstallCommands,
  getMarkdownPageUrl,
  type PackageManager,
} from '@/lib/install-command'

interface CommandCopyProps {
  name: string
  highlight?: boolean
  // For Vue, we need to use the `shadcn-vue` package instead of `shadcn`
  framework?: 'react' | 'vue'
}

type InstallationTab = 'prompt' | PackageManager

const LOCAL_STORAGE_KEY = 'installation-command-tab'
const PACKAGE_MANAGERS: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun']

export function Command({ name, highlight, framework = 'react' }: CommandCopyProps) {
  const pathname = usePathname()
  const [value, setValue] = useLocalStorage<InstallationTab>(LOCAL_STORAGE_KEY, 'prompt')

  const commands = getInstallCommands(name, { framework })
  const prompt = buildBlockInstallPrompt({
    pageUrl: getMarkdownPageUrl(pathname ?? ''),
    name,
    installCommand: commands.npm,
  })
  const tabs: InstallationTab[] = ['prompt', ...PACKAGE_MANAGERS]
  const activeTab = tabs.includes(value) ? value : 'prompt'

  return (
    <Tabs
      value={activeTab}
      onValueChange={(tab) => setValue(tab as InstallationTab)}
      className="w-full"
    >
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
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab} className="text-xs">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => {
            const isPrompt = tab === 'prompt'
            const content = isPrompt ? prompt : commands[tab]

            return (
              <TabsContent key={tab} value={tab} className="m-0">
                <div className={cn('flex gap-2', isPrompt ? 'items-start' : 'items-center')}>
                  <div
                    className={cn(
                      'min-w-0 flex-1 text-sm text-foreground relative z-10',
                      isPrompt ? 'leading-6' : 'font-mono'
                    )}
                  >
                    {!isPrompt && <span className="mr-2 text-[#888] select-none">$</span>}
                    {content}
                  </div>
                  <div className="relative z-10 shrink-0">
                    <CommandCopyButton
                      command={content}
                      telemetryCommand={isPrompt ? commands.npm : content}
                    />
                  </div>
                </div>
              </TabsContent>
            )
          })}
        </div>
      </div>
    </Tabs>
  )
}
