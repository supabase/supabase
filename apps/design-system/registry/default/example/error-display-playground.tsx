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
import { COMPACT_LAYOUT_BREAKPOINT, ErrorDisplay } from 'ui-patterns/ErrorDisplay'
import type { ErrorDisplaySize, ErrorDisplayStep, ErrorDisplayType } from 'ui-patterns/ErrorDisplay'

const MIN_WIDTH = 240
const MAX_WIDTH = 800

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const ALL_STEPS: ErrorDisplayStep[] = [
  {
    id: 'guide',
    title: 'Check the troubleshooting guide',
    description: 'Diagnose connection timeouts step by step.',
    action: { label: 'View guide', href: 'https://supabase.com/docs/guides/troubleshooting' },
  },
  {
    id: 'ai',
    title: 'Debug with AI',
    description: 'Ask the assistant to diagnose this error.',
    action: {
      label: 'Debug with AI',
      onClick: () => {
        toast('Opening the assistant')
      },
    },
  },
  {
    id: 'restart',
    title: 'Restart your project',
    description: 'Clears stale connections held by the pooler.',
    action: {
      label: 'Restart project',
      onClick: () => {
        toast.success('Opening the restart confirmation')
      },
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
  const [size, setSize] = useState<ErrorDisplaySize>('auto')
  const [stepCount, setStepCount] = useState(3)
  const [hasError, setHasError] = useState(true)
  const [hasDescription, setHasDescription] = useState(false)
  const [hasRetry, setHasRetry] = useState(false)
  const [width, setWidth] = useState(560)

  const resolvedSize =
    size === 'auto' ? (width < COMPACT_LAYOUT_BREAKPOINT ? 'compact' : 'full') : size

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

        <Control label="Size">
          <Select value={size} onValueChange={(value) => setSize(value as ErrorDisplaySize)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">auto</SelectItem>
              <SelectItem value="compact">compact</SelectItem>
              <SelectItem value="full">full</SelectItem>
            </SelectContent>
          </Select>
        </Control>

        <Control label="Steps">
          <Select value={String(stepCount)} onValueChange={(value) => setStepCount(Number(value))}>
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

        <Control label="Description">
          <Switch checked={hasDescription} onCheckedChange={setHasDescription} />
        </Control>

        <Control label="Raw error">
          <Switch checked={hasError} onCheckedChange={setHasError} />
        </Control>

        <Control label="Retry">
          <Switch checked={hasRetry} onCheckedChange={setHasRetry} />
        </Control>

        <Control label={`Container width — ${Math.round(width)}px (${resolvedSize})`}>
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
          size={size}
          title="Failed to retrieve tables"
          description={
            hasDescription
              ? 'The database connection timed out before the query finished.'
              : undefined
          }
          error={
            hasError
              ? {
                  message: 'Connection terminated due to connection timeout',
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
          steps={ALL_STEPS.slice(0, stepCount)}
          supportFormParams={{ projectRef: 'abcdefghijklmnopqrst' }}
          onContactSupport={(details) => console.log('Contact support', details)}
        />
      </div>
    </div>
  )
}
