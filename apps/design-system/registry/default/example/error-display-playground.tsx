'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Switch,
} from 'ui'
import { ErrorDisplay } from 'ui-patterns/ErrorDisplay'
import type { ErrorDisplayAction, ErrorDisplayType } from 'ui-patterns/ErrorDisplay'

const MIN_WIDTH = 240
const MAX_WIDTH = 800

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

type ContentScenario =
  | 'description-and-verbose-error'
  | 'description-and-concise-error'
  | 'description-only'
  | 'verbose-error-only'
  | 'concise-error-only'

const VERBOSE_ERROR = `Connection terminated due to connection timeout

DETAIL: The connection pool could not acquire a database connection before the configured timeout elapsed.
CONTEXT: while loading relations for schemas public, auth, storage, realtime, and extensions
QUERY: select n.nspname as schema_name, c.relname as table_name, c.relkind from pg_class c join pg_namespace n on n.oid = c.relnamespace where c.relkind in ('r', 'p', 'v', 'm', 'f')
HINT: Check for long-running transactions, exhausted connection slots, or an unavailable database before retrying.

Error: connection acquisition timed out after 30000ms
    at acquireConnection (database-pool.ts:184:11)
    at async loadTables (table-editor.ts:92:18)
    at async Promise.all (index 0)`

const ALL_ACTIONS: ErrorDisplayAction[] = [
  {
    id: 'guide',
    label: 'View guide',
    href: 'https://supabase.com/docs/guides/troubleshooting',
  },
  {
    id: 'ai',
    label: 'Debug with AI',
    onClick: () => {
      toast('Opening the assistant')
    },
  },
  {
    id: 'restart',
    label: 'Restart project',
    onClick: () => {
      toast.success('Opening the restart confirmation')
    },
  },
]

function Control({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-36 flex-col gap-1.5">
      <Label className="text-xs text-foreground-light">{label}</Label>
      {children}
    </div>
  )
}

export default function ErrorDisplayPlayground() {
  const [type, setType] = useState<ErrorDisplayType>('info')
  const [content, setContent] = useState<ContentScenario>('description-and-verbose-error')
  const [actionCount, setActionCount] = useState(3)
  const [hasRetry, setHasRetry] = useState(false)
  const [hasIcon, setHasIcon] = useState(true)
  const [width, setWidth] = useState(560)

  const hasDescription = content.startsWith('description')
  const hasError = content.includes('error')
  const isVerboseError = content.includes('verbose')

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <Control label="Type">
          <Select value={type} onValueChange={(value) => setType(value as ErrorDisplayType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="info">info</SelectItem>
              <SelectItem value="warning">warning</SelectItem>
              <SelectItem value="destructive">destructive</SelectItem>
            </SelectContent>
          </Select>
        </Control>

        <Control label="Content">
          <Select value={content} onValueChange={(value) => setContent(value as ContentScenario)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="description-and-verbose-error">
                description + verbose error
              </SelectItem>
              <SelectItem value="description-and-concise-error">
                description + concise error
              </SelectItem>
              <SelectItem value="description-only">description only</SelectItem>
              <SelectItem value="verbose-error-only">verbose error only</SelectItem>
              <SelectItem value="concise-error-only">concise error only</SelectItem>
            </SelectContent>
          </Select>
        </Control>

        <Control label="Actions">
          <Select
            value={String(actionCount)}
            onValueChange={(value) => setActionCount(Number(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">0</SelectItem>
              <SelectItem value="1">1</SelectItem>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
            </SelectContent>
          </Select>
        </Control>

        <Control label="Retry">
          <Switch checked={hasRetry} onCheckedChange={setHasRetry} />
        </Control>

        <Control label="Icon">
          <Switch checked={hasIcon} onCheckedChange={setHasIcon} />
        </Control>

        <Control label={`Container width — ${Math.round(width)}px`}>
          <Slider
            value={[width]}
            min={MIN_WIDTH}
            max={MAX_WIDTH}
            step={4}
            onValueChange={([value]) => setWidth(value)}
            className="w-56"
            aria-label="Container width"
          />
        </Control>
      </div>

      <div
        className="rounded-md outline-1 outline-dashed outline-offset-8 outline-border-stronger"
        style={{ width }}
      >
        <ErrorDisplay
          type={type}
          showIcon={hasIcon}
          title="Failed to retrieve tables"
          description={
            hasDescription
              ? 'The database connection timed out before the query finished.'
              : undefined
          }
          error={
            hasError
              ? {
                  message: isVerboseError
                    ? VERBOSE_ERROR
                    : 'Connection terminated due to connection timeout',
                  requestId: 'req_8f2a91c',
                  timestamp: '2026-10-07T14:02:51Z',
                }
              : undefined
          }
          onRetry={
            hasRetry
              ? async () => {
                  await wait(1500)
                  toast.error('Retry failed. The connection timed out again.')
                }
              : undefined
          }
          actions={ALL_ACTIONS.slice(0, actionCount)}
          supportFormParams={{ projectRef: 'abcdefghijklmnopqrst' }}
          onContactSupport={(details) => console.log('Contact support', details)}
        />
      </div>
    </div>
  )
}
