// DEPR-705 "Debug mode" prototype — split out of UnifiedLogs so its 1-second
// countdown tick (while max is timed) only re-renders this small banner,
// not the whole logs page (table, chart, facets).
import { useParams } from 'common'
import { ChevronDownIcon } from 'lucide-react'
import Link from 'next/link'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { MAX_DURATION_OPTIONS, useCountdownText, useDebugMode } from '@/state/debug-mode'

export const DebugModeBanner = () => {
  const { ref: projectRef } = useParams()
  const { state: debugState, setLevel: setDebugLevel } = useDebugMode(projectRef)
  const countdownText = useCountdownText(debugState.maxExpiresAt)

  if (debugState.level === 'off') return null

  const description =
    debugState.level === 'min'
      ? "Capturing errors and what Supabase needs. Ordinary request/response chatter isn't ingested."
      : countdownText
        ? `Capturing everything, across every source. Reverts to min in ${countdownText}.`
        : 'Capturing everything, across every source.'

  return (
    <Admonition
      type={debugState.level === 'max' ? 'warning' : 'default'}
      layout="horizontal"
      title={`Debug mode - ${debugState.level}`}
      description={description}
      className="rounded-none border-x-0 border-t-0"
      actions={
        debugState.level === 'min' ? (
          <div className="flex items-center">
            <Button
              type="button"
              size="tiny"
              variant="default"
              className="rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
              onClick={() => setDebugLevel('max', { durationMs: null })}
            >
              Switch to max
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="tiny"
                  variant="default"
                  aria-label="Choose duration"
                  className="shrink-0 rounded-l-none -ml-px focus-visible:z-10 focus-visible:rounded-l-sm px-1"
                  icon={<ChevronDownIcon size={14} />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {MAX_DURATION_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option.id}
                    onClick={() => setDebugLevel('max', { durationMs: option.ms })}
                  >
                    {option.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex items-center">
            <Button
              type="button"
              size="tiny"
              variant="default"
              className="rounded-r-none hover:z-10 focus-visible:z-10 focus-visible:rounded-r-sm"
              onClick={() => setDebugLevel('off')}
            >
              Turn off
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  size="tiny"
                  variant="default"
                  aria-label="More options"
                  className="shrink-0 rounded-l-none -ml-px focus-visible:z-10 focus-visible:rounded-l-sm px-1"
                  icon={<ChevronDownIcon size={14} />}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/project/${projectRef}/settings/general#debug-mode`}>
                    Go to Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      }
    />
  )
}
