'use client'

import { useIsLoggedIn, useIsUserLoading } from 'common'
import { Check, Copy, Loader2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import {
  Button,
  cn,
  copyToClipboard,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'

import { useLocalStorage } from '../use-local-storage'
import { ProjectPicker } from './ProjectPicker'

type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun'

const LOCAL_STORAGE_KEY = 'package-manager-tanstack-db'

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'production') {
    return 'https://supabase.com/ui'
  } else if (process.env.NEXT_PUBLIC_VERCEL_TARGET_ENV === 'preview') {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_BRANCH_URL}`
  } else {
    return 'http://localhost:3004/ui'
  }
}

export function TanstackDBGenerator() {
  const isUserLoading = useIsUserLoading()
  const isLoggedIn = useIsLoggedIn()

  const [resolvedProject, setResolvedProject] = useState<{
    projectRef: string
    anonKey: string
  } | null>(null)
  const [hasCopied, setHasCopied] = useState(false)
  const [packageManager, setPackageManager] = useLocalStorage(LOCAL_STORAGE_KEY, 'npm')

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
            Copy the command below to install the block.
          </div>

          <Tabs value={packageManager} onValueChange={setPackageManager} className="w-full">
            <div className="w-full group relative rounded-lg bg-surface-200 dark:bg-surface-100 px-4 py-2 overflow-hidden">
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
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-sm text-foreground relative z-10 overflow-x-auto">
                        <span className="mr-2 text-[#888] select-none">$</span>
                        <span className="whitespace-nowrap">{commands[manager]}</span>
                      </div>
                      <Button
                        size="small"
                        type="outline"
                        className={cn(
                          'relative z-10 h-6 w-6 text-foreground-muted hover:bg-surface-100 hover:text-foreground p-0 shrink-0'
                        )}
                        onClick={() => handleCopy(commands[manager])}
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
                ))}
              </div>
            </div>
          </Tabs>
        </>
      )}
    </div>
  )
}
