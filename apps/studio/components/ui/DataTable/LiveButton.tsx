import { CirclePauseIcon, CirclePlayIcon } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { useEffect } from 'react'
import { Button } from 'ui'

import { useDataTable } from './providers/DataTableProvider'
import type { SEARCH_PARAMS_PARSER } from '@/components/interfaces/UnifiedLogs/UnifiedLogs.constants'
import { ShortcutTooltip } from '@/components/ui/ShortcutTooltip'
import { parseUnifiedLogsDuration } from '@/data/logs/unified-logs-time-range'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

const REFRESH_INTERVAL = 10_000

interface LiveButtonProps {
  searchParamsParser: Pick<
    typeof SEARCH_PARAMS_PARSER,
    'live' | 'date' | 'sort' | 'durationSeconds'
  >
  onPoll: () => Promise<{ isCatchingUp: boolean }>
  isCatchingUp?: boolean
}

export function LiveButton({ onPoll, isCatchingUp, searchParamsParser }: LiveButtonProps) {
  const [{ live, date, sort, durationSeconds }, setSearch] = useQueryStates(searchParamsParser)
  const selectedDuration =
    date?.length === 2
      ? parseUnifiedLogsDuration(String((date[1].getTime() - date[0].getTime()) / 1000))
      : (durationSeconds ?? 3600)
  const { table } = useDataTable()
  useShortcut(SHORTCUT_IDS.DATA_TABLE_TOGGLE_LIVE, handleClick, { registerInCommandMenu: false })

  useEffect(() => {
    if (!live) return

    let isActive = true
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    async function fetchData() {
      const result = await onPoll().catch(() => ({ isCatchingUp: false }))
      if (isActive) {
        timeoutId = setTimeout(fetchData, result.isCatchingUp ? 250 : REFRESH_INTERVAL)
      }
    }

    fetchData()

    return () => {
      isActive = false
      clearTimeout(timeoutId)
    }
  }, [live, onPoll])

  useEffect(() => {
    if (date && (live || durationSeconds !== null)) setSearch({ live: null, durationSeconds: null })
    else if (sort && live) setSearch({ live: null })
  }, [date, sort, live, durationSeconds, setSearch])

  function handleClick() {
    if (live) {
      setSearch({ live: false })
      return
    }
    if (selectedDuration === null) return
    setSearch({
      live: true,
      date: null,
      sort: null,
      durationSeconds: date ? selectedDuration : durationSeconds,
    })
    table.getColumn('date')?.setFilterValue(undefined)
    table.resetSorting()
  }

  return (
    <ShortcutTooltip
      shortcutId={SHORTCUT_IDS.DATA_TABLE_TOGGLE_LIVE}
      label={live ? 'Pause live mode' : 'Start live mode'}
      side="bottom"
    >
      <Button
        onClick={handleClick}
        disabled={!live && selectedDuration === null}
        variant={live ? 'primary' : 'default'}
        size="tiny"
        icon={
          live ? <CirclePauseIcon className="h-4 w-4" /> : <CirclePlayIcon className="h-4 w-4" />
        }
      >
        {live && isCatchingUp ? 'Catching up' : 'Live'}
      </Button>
    </ShortcutTooltip>
  )
}
