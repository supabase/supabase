'use client'

import { Check, Copy, Loader2 } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  Input_Shadcn_ as Input,
  Label_Shadcn_ as Label,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  cn,
  copyToClipboard,
} from 'ui'

import { useLocalStorage } from './use-local-storage'

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
  const [projectRef, setProjectRef] = useState('')
  const [anonKey, setAnonKey] = useState('')
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isGenerated, setIsGenerated] = useState(false)
  const [hasCopied, setHasCopied] = useState(false)
  const [packageManager, setPackageManager] = useLocalStorage(LOCAL_STORAGE_KEY, 'npm')

  const baseUrl = getBaseUrl()
  const apiUrl = `${baseUrl}${process.env.NEXT_PUBLIC_BASE_PATH ?? ''}/api/registry/tanstack-db?ref=${encodeURIComponent(projectRef)}&anonKey=${encodeURIComponent(anonKey)}`

  const commands: Record<PackageManager, string> = {
    npm: `npx shadcn@latest add "${apiUrl}"`,
    pnpm: `pnpm dlx shadcn@latest add "${apiUrl}"`,
    yarn: `yarn dlx shadcn@latest add "${apiUrl}"`,
    bun: `bunx --bun shadcn@latest add "${apiUrl}"`,
  }

  const handleValidate = async () => {
    if (!projectRef.trim() || !anonKey.trim()) {
      setValidationError('Please enter both Project Ref and Anon Key')
      return
    }

    setIsValidating(true)
    setValidationError(null)

    try {
      // Test the connection by fetching the OpenAPI spec
      const response = await fetch(`https://${projectRef}.supabase.co/rest/v1/`, {
        headers: {
          apikey: anonKey,
        },
      })

      if (!response.ok) {
        throw new Error(`Invalid credentials or project not found (${response.status})`)
      }

      const data = await response.json()

      if (!data.definitions || Object.keys(data.definitions).length === 0) {
        setValidationError('No tables found in your database. Create some tables first.')
        return
      }

      setIsGenerated(true)
    } catch (error) {
      setValidationError(
        error instanceof Error ? error.message : 'Failed to connect to your Supabase project'
      )
    } finally {
      setIsValidating(false)
    }
  }

  const handleCopy = (command: string) => {
    copyToClipboard(command)
    setHasCopied(true)
    setTimeout(() => setHasCopied(false), 2000)
  }

  const handleReset = () => {
    setIsGenerated(false)
    setProjectRef('')
    setAnonKey('')
    setValidationError(null)
  }

  return (
    <div className="mt-6 space-y-4">
      {!isGenerated ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="project-ref">Project Ref</Label>
              <Input
                id="project-ref"
                placeholder="your-project-ref"
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Found in your project settings or URL (e.g., abcdefghijklmnop)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="anon-key">Anon Key</Label>
              <Input
                id="anon-key"
                placeholder="eyJhbGciOiJIUzI1NiIs..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                className="font-mono"
                type="password"
              />
              <p className="text-xs text-muted-foreground">
                Found in your project&apos;s API settings
              </p>
            </div>
          </div>

          {validationError && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {validationError}
            </div>
          )}

          <Button
            onClick={handleValidate}
            disabled={isValidating || !projectRef.trim() || !anonKey.trim()}
            className="w-full sm:w-auto"
          >
            {isValidating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Validating...
              </>
            ) : (
              'Generate Installation Command'
            )}
          </Button>
        </>
      ) : (
        <>
          <div className="rounded-md bg-brand-400/10 border border-brand-400/20 p-3 text-sm text-brand-600">
            Successfully connected to your Supabase project. Copy the command below to install the
            block.
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

          <Button type="outline" onClick={handleReset} className="w-full sm:w-auto">
            Generate for a different project
          </Button>
        </>
      )}
    </div>
  )
}
