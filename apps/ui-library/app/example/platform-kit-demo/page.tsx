'use client'

import { createClient } from '@supabase/supabase-js'
import { useState } from 'react'

import { Button } from '@/registry/default/components/ui/button'
import { Input } from '@/registry/default/components/ui/input'
import { Label } from '@/registry/default/components/ui/label'
import SupabaseManagerDialog from '@/registry/default/platform/platform-kit-nextjs/components/supabase-manager'
import { createSupabaseAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/create-supabase-adapter'
import { createSupaliteAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/create-supalite-adapter'
import type { PlatformAdapter } from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/types'

type Mode = 'supabase' | 'supalite'

/**
 * Throwaway harness for the Platform Kit. Not part of the registry.
 * Route: /example/platform-kit-demo
 */
export default function PlatformKitDemoPage() {
  const [mode, setMode] = useState<Mode>('supabase')
  const [url, setUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [projectRef, setProjectRef] = useState('')
  const [managementBaseUrl, setManagementBaseUrl] = useState('')
  const [enableStorage, setEnableStorage] = useState(false)

  const [adapter, setAdapter] = useState<PlatformAdapter | null>(null)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleOpen = () => {
    setError(null)
    try {
      if (mode === 'supalite') {
        const origin = url || (typeof window !== 'undefined' ? window.location.origin : '')
        const supabase = createClient(origin, apiKey || 'any-string-works-for-now')
        setAdapter(createSupaliteAdapter({ supabase, baseUrl: origin, enableStorage }))
      } else {
        if (!url || !apiKey) {
          setError('Supabase URL and key are required.')
          return
        }
        const supabase = createClient(url, apiKey)
        setAdapter(
          createSupabaseAdapter({
            supabase,
            projectRef: projectRef || undefined,
            management: managementBaseUrl
              ? { baseUrl: managementBaseUrl, projectRef: projectRef || 'local' }
              : undefined,
          })
        )
      }
      setOpen(true)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create adapter.')
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Platform Kit demo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Wire an adapter and open the manager dialog. This page is a local test harness.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={mode === 'supabase' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('supabase')}
        >
          Supabase
        </Button>
        <Button
          variant={mode === 'supalite' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('supalite')}
        >
          supalite
        </Button>
      </div>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="url">
            {mode === 'supalite' ? 'supalite origin (blank = current origin)' : 'Supabase URL'}
          </Label>
          <Input
            id="url"
            placeholder={
              mode === 'supalite' ? 'http://localhost:5173' : 'https://<ref>.supabase.co'
            }
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="key">
            {mode === 'supalite' ? 'Key (any string)' : 'API key (service_role for full access)'}
          </Label>
          <Input
            id="key"
            type="password"
            placeholder={mode === 'supalite' ? 'any-string-works-for-now' : 'eyJhbGci...'}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
        </div>

        {mode === 'supabase' && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="ref">Project ref (optional, for dashboard link)</Label>
              <Input
                id="ref"
                placeholder="abcdefghijklmno"
                value={projectRef}
                onChange={(e) => setProjectRef(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mgmt">Management proxy base URL (optional)</Label>
              <Input
                id="mgmt"
                placeholder="/api/supabase-proxy"
                value={managementBaseUrl}
                onChange={(e) => setManagementBaseUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enables Auth config, Logs, Secrets, Suggestions, and the SQL editor. Leave blank for
                a supabase-js-only setup.
              </p>
            </div>
          </>
        )}

        {mode === 'supalite' && (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enableStorage}
              onChange={(e) => setEnableStorage(e.target.checked)}
            />
            Enable Storage (supalite EXPERIMENTAL_STORAGE)
          </label>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleOpen}>Open Supabase Manager</Button>

      {adapter && <SupabaseManagerDialog adapter={adapter} open={open} onOpenChange={setOpen} />}
    </div>
  )
}
