import type { FetchPreviousPageOptions } from '@tanstack/react-query'
import { CirclePause, CirclePlay } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from 'ui'

import { useDataTable } from './providers/DataTableProvider'
import { useLivePolling } from './useLivePolling'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { useTrack } from '@/lib/telemetry/track'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const LIVE_MODE_PAUSED_TOAST_ID = 'live-mode-paused-for-inactivity'

interface LiveButtonProps {
  searchParamsParser: any
  fetchPreviousPage?: (options?: FetchPreviousPageOptions | undefined) => Promise<unknown>
}

export function LiveButton({ fetchPreviousPage, searchParamsParser }: LiveButtonProps) {
  const [{ live, date, sort }, setSearch] = useQueryStates(searchParamsParser)
  const { table } = useDataTable()
  const track = useTrack()
  useShortcut(SHORTCUT_IDS.DATA_TABLE_TOGGLE_LIVE, handleClick, { registerInCommandMenu: false })

  useLivePolling({
    isEnabled: Boolean(live),
    poll: () => fetchPreviousPage?.() ?? Promise.resolve(undefined),
    onIdle: handleIdle,
  })

  // The paused notice only makes sense while live mode is off, and only on this page.
  useEffect(() => {
    if (live) toast.dismiss(LIVE_MODE_PAUSED_TOAST_ID)
  }, [live])
  useEffect(() => () => void toast.dismiss(LIVE_MODE_PAUSED_TOAST_ID), [])

  // REMINDER: make sure to reset live when date is set
  // TODO: test properly
  useEffect(() => {
    if ((date || sort) && live) {
      setSearch((prev) => ({ ...prev, live: null }))
    }
  }, [date, sort])

  // Live mode always follows the newest logs, so turning it on or off clears any date range and sort.
  function setLive(getLive: (wasLive: boolean) => boolean) {
    setSearch((prev) => ({
      ...prev,
      live: getLive(Boolean(prev.live)),
      date: null,
      sort: null,
    }))
    table.getColumn('date')?.setFilterValue(undefined)
    table.resetSorting()
  }

  function handleClick() {
    setLive((wasLive) => !wasLive)
  }

  function handleIdle() {
    setSearch((prev) => ({ ...prev, live: null }))
    toast('Live mode paused after 15 minutes of inactivity', {
      id: LIVE_MODE_PAUSED_TOAST_ID,
      duration: Infinity,
      action: { label: 'Resume live mode', onClick: handleResume },
    })
  }

  function handleResume() {
    track('unified_logs_live_mode_resume_button_clicked', { pauseReason: 'inactivity' })
    setLive(() => true)
  }

  return (
    <ShortcutTooltip
      shortcutId={SHORTCUT_IDS.DATA_TABLE_TOGGLE_LIVE}
      label={live ? 'Pause live mode' : 'Start live mode'}
      side="bottom"
    >
      <Button
        onClick={handleClick}
        variant={live ? 'primary' : 'default'}
        size="tiny"
        icon={live ? <CirclePause className="h-4 w-4" /> : <CirclePlay className="h-4 w-4" />}
      >
        Live
      </Button>
    </ShortcutTooltip>
  )
}
