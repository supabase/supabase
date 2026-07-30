'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import { CommandCopyButton } from './command-copy-button'
import { useLocalStorage } from './use-local-storage'

interface CommandCopyProps {
  name: string
  highlight?: boolean
  // For Vue, we need to use the `shadcn-vue` package instead of `shadcn`
  framework?: 'react' | 'vue'
}

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'
type InstallationTab = 'prompt' | PackageManager

const LOCAL_STORAGE_KEY = 'installation-command-tab'

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'production') {
    // we have a special alias for the production environment, added in https://github.com/shadcn-ui/ui/pull/8161
    return `@supabase`
  } else if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'preview') {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  } else {
    return 'http://localhost:3004'
  }
}

const getComponentPath = (name: string) => {
  if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'production') {
    return `/${name}`
  } else {
    return `${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/r/${name}.json`
  }
}

export function Command({ name, highlight, framework = 'react' }: CommandCopyProps) {
  const pathname = usePathname()
  const [value, setValue] = useLocalStorage<InstallationTab>(LOCAL_STORAGE_KEY, 'prompt')

  const baseUrl = getBaseUrl()
  const componentPath = getComponentPath(name)

  const commands: Record<PackageManager, string> =
    framework === 'vue'
      ? {
          npm: `npx shadcn-vue@latest add ${baseUrl}${componentPath}`,
          pnpm: `pnpm dlx shadcn-vue@latest add ${baseUrl}${componentPath}`,
          yarn: `yarn dlx shadcn-vue@latest add ${baseUrl}${componentPath}`,
          bun: `bunx --bun shadcn-vue@latest add ${baseUrl}${componentPath}`,
        }
      : {
          npm: `npx shadcn@latest add ${baseUrl}${componentPath}`,
          pnpm: `pnpm dlx shadcn@latest add ${baseUrl}${componentPath}`,
          yarn: `yarn dlx shadcn@latest add ${baseUrl}${componentPath}`,
          bun: `bunx --bun shadcn@latest add ${baseUrl}${componentPath}`,
        }

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  const currentPath = pathname?.startsWith(basePath) ? pathname : `${basePath}${pathname ?? ''}`
  const pageUrl = `https://supabase.com${currentPath}`
  const prompt = [
    `Read the installation instructions at ${pageUrl} before making changes.`,
    '',
    `Then install the ${name} block in the current project with:`,
    '',
    commands.npm,
    '',
    'Follow the remaining setup and configuration steps on that page.',
  ].join('\n')
  const tabs: InstallationTab[] = ['prompt', ...Object.keys(commands)] as InstallationTab[]

  return (
    <Tabs
      value={value}
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
              <TabsTrigger key={tab} value={tab} className="text-xs capitalize">
                {tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => {
            const content = tab === 'prompt' ? prompt : commands[tab]

            return (
              <TabsContent key={tab} value={tab} className="m-0">
                <div className="flex items-start gap-2">
                  <div
                    className={`flex-1 font-mono text-sm text-foreground relative z-10 ${
                      tab === 'prompt' ? 'whitespace-pre-wrap leading-6' : ''
                    }`}
                  >
                    {tab !== 'prompt' && <span className="mr-2 text-[#888] select-none">$</span>}
                    {content}
                  </div>
                  <div className="relative z-10">
                    <CommandCopyButton
                      command={content}
                      telemetryCommand={tab === 'prompt' ? commands.npm : content}
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
