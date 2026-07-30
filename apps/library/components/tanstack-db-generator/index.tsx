'use client'

import { useIsLoggedIn, useIsUserLoading } from 'common'
import { Check, Copy, Loader2 } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useCallback, useState } from 'react'
import { Button, cn, copyToClipboard, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'

import { useLocalStorage } from '../use-local-storage'
import { ProjectPicker } from './ProjectPicker'

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'
type InstallationTab = 'prompt' | PackageManager

const LOCAL_STORAGE_KEY = 'installation-command-tanstack-db'

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'production') {
    return 'https://supabase.com/library'
  } else if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'preview') {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  } else {
    return 'http://localhost:3004/library'
  }
}

const getPageBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'production') {
    return 'https://supabase.com'
  } else if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'preview') {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  } else {
    return 'http://localhost:3004'
  }
}

export function TanstackDBGenerator() {
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()
  const pathname = usePathname()

  const [resolvedProject, setResolvedProject] = useState<{
    projectRef: string
    anonKey: string
  } | null>(null)
  const [hasCopied, setHasCopied] = useState(false)
  const [packageManager, setPackageManager] = useLocalStorage<InstallationTab>(
    LOCAL_STORAGE_KEY,
    'prompt'
  )

  const handleProjectResolved = useCallback(
    (data: { projectRef: string; anonKey: string } | null) => {
      setResolvedProject(data)
    },
    []
  )

  const baseUrl = getBaseUrl()
  const apiUrl = resolvedProject
    ? `${baseUrl}/api/registry/tanstack-db?ref=${encodeURIComponent(resolvedProject.projectRef)}&anonKey=${encodeURIComponent(resolvedProject.anonKey)}`
    : ''

  const commands: Record<PackageManager, string> = {
    npm: `npx shadcn@latest add "${apiUrl}"`,
    pnpm: `pnpm dlx shadcn@latest add "${apiUrl}"`,
    yarn: `yarn dlx shadcn@latest add "${apiUrl}"`,
    bun: `bunx --bun shadcn@latest add "${apiUrl}"`,
  }
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''
  const currentPath = pathname?.startsWith(basePath) ? pathname : `${basePath}${pathname ?? ''}`
  const pageUrl = `${getPageBaseUrl()}${currentPath}`
  const prompt = [
    `Read the installation instructions at ${pageUrl} before making changes.`,
    '',
    'Then install this TanStack DB block in the current project with:',
    '',
    commands.npm,
    '',
    'Follow the remaining setup and configuration steps on that page.',
  ].join('\n')
  const tabs: InstallationTab[] = ['prompt', ...Object.keys(commands)] as InstallationTab[]

  const handleCopy = (command: string) => {
    copyToClipboard(command)
    setHasCopied(true)
    setTimeout(() => setHasCopied(false), 2000)
  }

  if (isUserLoading) {
    return (
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </div>
    )
  }

  if (!isLoggedIn) {
    return (
      <div className="mt-6 rounded-md border border-default bg-surface-100 p-4">
        <p className="text-sm text-foreground-light">
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noreferrer noopener"
            className="text-foreground underline"
          >
            Log in
          </a>{' '}
          to your Supabase account to generate installation commands for your project.
        </p>
      </div>
    )
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Select a project</label>
        <ProjectPicker onProjectResolved={handleProjectResolved} />
      </div>

      {resolvedProject && (
        <>
          <div className="rounded-md bg-brand-400/10 border border-brand-400/20 p-3 text-sm text-brand-600">
            Copy the prompt to ask an agent to install the block, or choose a package-manager
            command.
          </div>

          <Tabs
            value={packageManager}
            onValueChange={(tab) => setPackageManager(tab as InstallationTab)}
            className="w-full"
          >
            <div className="w-full group relative rounded-lg bg-surface-200 dark:bg-surface-100 px-4 py-2 overflow-hidden">
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
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex-1 font-mono text-sm text-foreground relative z-10 ${
                            tab === 'prompt' ? 'whitespace-pre-wrap leading-6' : 'overflow-x-auto'
                          }`}
                        >
                          {tab !== 'prompt' && (
                            <span className="mr-2 text-[#888] select-none">$</span>
                          )}
                          <span className={tab === 'prompt' ? undefined : 'whitespace-nowrap'}>
                            {content}
                          </span>
                        </div>
                        <Button
                          size="small"
                          variant="outline"
                          className={cn(
                            'relative z-10 h-6 w-6 text-foreground-muted hover:bg-surface-100 hover:text-foreground p-0 shrink-0'
                          )}
                          onClick={() => handleCopy(content)}
                        >
                          <span className="sr-only">Copy</span>
                          {hasCopied ? (
                            <Check className="h-3 w-3 text-brand-600" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TabsContent>
                  )
                })}
              </div>
            </div>
          </Tabs>
        </>
      )}
    </div>
  )
}
