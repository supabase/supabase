import { LOCAL_STORAGE_KEYS } from 'common'
import { useParams } from 'common/hooks'
import dayjs from 'dayjs'
import { AnimatePresence, motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { Badge, Button, cn } from 'ui'

import { BannerCard } from '../BannerCard'
import { useBannerStack } from '../BannerStackProvider'
import {
  useFeaturePreviewModal,
  useUnifiedLogsPreview,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

// Number of rows visible in the carousel viewport. We keep one extra row in
// state so the row sliding out of view has something to animate towards.
const VISIBLE_ROWS = 3
const ROW_HEIGHT = 28
const TICK_MS = 3000

const SAMPLES = [200, 200, 201, 200, 304, 400, 200, 500] as const

interface LogEntry {
  id: number
  timestamp: string
  status: number
}

const makeEntry = (id: number, offsetSeconds = 0): LogEntry => ({
  id,
  timestamp: dayjs().subtract(offsetSeconds, 'second').format('DD MMM YY HH:mm:ss'),
  status: SAMPLES[id % SAMPLES.length],
})

const LogRow = ({ entry }: { entry: LogEntry }) => {
  const isDestructive = entry.status >= 500
  const isWarning = entry.status >= 400 && entry.status < 500
  return (
    <div
      className="flex items-center gap-x-3 font-mono text-xs whitespace-nowrap text-foreground-light"
      style={{ height: ROW_HEIGHT }}
    >
      <span
        className={cn(
          'size-1.5 shrink-0 rounded-full bg-foreground-muted',
          isWarning && 'bg-warning',
          isDestructive && 'bg-destructive'
        )}
      />
      <span
        className={cn(
          'tabular-nums',
          isWarning && 'text-warning',
          isDestructive && 'text-destructive'
        )}
      >
        {entry.timestamp}
      </span>
      <span
        className={cn(
          'tabular-nums',
          isWarning && 'text-warning',
          isDestructive && 'text-destructive'
        )}
      >
        {entry.status}
      </span>
    </div>
  )
}

const UnifiedLogsCarousel = () => {
  const counter = useRef(VISIBLE_ROWS)
  const [logs, setLogs] = useState<LogEntry[]>(() =>
    Array.from({ length: VISIBLE_ROWS + 1 }, (_, i) => makeEntry(VISIBLE_ROWS - i, i))
  )

  useEffect(() => {
    const interval = setInterval(() => {
      counter.current += 1
      const next = makeEntry(counter.current)
      setLogs((prev) => [next, ...prev].slice(0, VISIBLE_ROWS + 1))
    }, TICK_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative w-full overflow-hidden" style={{ height: ROW_HEIGHT * VISIBLE_ROWS }}>
      <AnimatePresence initial={false}>
        {logs.map((entry, index) => (
          <motion.div
            key={entry.id}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: Math.max(1 - index * 0.4, 0) }}
            exit={{ opacity: 0 }}
          >
            <LogRow entry={entry} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export const BannerUnifiedLogs = () => {
  const { ref } = useParams()
  const track = useTrack()
  const { dismissBanner } = useBannerStack()
  const { isEnabled } = useUnifiedLogsPreview()
  const { selectFeaturePreview } = useFeaturePreviewModal()
  const [, setIsDismissed] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.UNIFIED_LOGS_BANNER_DISMISSED,
    false
  )

  return (
    <BannerCard
      onDismiss={() => {
        setIsDismissed(true)
        dismissBanner('unified-logs-banner')
        track('unified_logs_banner_dismiss_button_clicked')
      }}
    >
      <div className="flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-2 items-start">
          <Badge variant="success" className="-ml-0.5 uppercase inline-flex items-center">
            Beta
          </Badge>
          <div className="-mx-6 w-[calc(100%+3rem)] bg-linear-to-t from-background to-transparent px-6 py-2 border-b">
            <UnifiedLogsCarousel />
          </div>
        </div>
        <div className="flex flex-col gap-y-1 mb-2">
          <p className="text-sm font-medium">Unified Logs is here</p>
          <p className="text-xs text-foreground-lighter text-balance">
            Search and correlate logs across all of your services from a single place.
          </p>
        </div>
        <div className="flex gap-2">
          {isEnabled ? (
            <Button variant="default" size="tiny" asChild>
              <Link
                href={`/project/${ref}/logs`}
                onClick={() => {
                  track('unified_logs_banner_cta_button_clicked', { is_enabled: true })
                  setIsDismissed(true)
                  dismissBanner('unified-logs-banner')
                }}
              >
                Explore Unified Logs
              </Link>
            </Button>
          ) : (
            <Button
              variant="default"
              size="tiny"
              onClick={() => {
                track('unified_logs_banner_cta_button_clicked', { is_enabled: false })
                selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_UNIFIED_LOGS)
              }}
            >
              Enable Unified Logs
            </Button>
          )}
        </div>
      </div>
    </BannerCard>
  )
}
