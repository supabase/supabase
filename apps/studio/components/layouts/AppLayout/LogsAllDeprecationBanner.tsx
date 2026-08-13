import { IS_PLATFORM, LOCAL_STORAGE_KEYS } from 'common'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import {
  Button,
  cn,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

import { HeaderBanner } from '@/components/interfaces/Organization/HeaderBanner'
import { InlineLink, InlineLinkClassName } from '@/components/ui/InlineLink'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { useTrack } from '@/lib/telemetry/track'

// Update this whenever the banner content below changes so old client bundles
// stop displaying outdated notices after the removal date passes.
const BANNER_EXPIRES_AT = new Date('2026-09-24T00:00:00Z')

const MIGRATION_GUIDE_URL =
  'https://supabase.com/changelog/48235-migration-of-supabase-management-api-logs-all-analytics-endpoint-to-logs-endpoint'

// Anchored to the section root so per-resource log pages (e.g. a single edge
// function's logs) don't pull the banner outside Logs/Observability.
const LOGS_SECTION_PATH = /^\/project\/[^/]+\/(logs|observability)(\/|$)/

/**
 * Informational notice for the removal of the `analytics/endpoints/logs.all`
 * Management API endpoint on 2026-09-23.
 *
 * Deliberately untargeted: whether a project called the endpoint is behaviour that
 * no API response the dashboard fetches carries, so this renders for everyone in the
 * Logs and Observability sections regardless of plan. The copy stays informational
 * rather than "action required" precisely because most viewers will not be
 * affected — see GROWTH-1093.
 */
export const LogsAllDeprecationBanner = () => {
  const pathname = usePathname()
  const track = useTrack()

  const [isDismissed, setIsDismissed, { isSuccess }] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LOGS_ALL_DEPRECATION_2026_09_23,
    false
  )

  const isInLogsSection = !!pathname && LOGS_SECTION_PATH.test(pathname)
  const isExpired = Date.now() >= BANNER_EXPIRES_AT.getTime()

  const shouldShow = IS_PLATFORM && !isExpired && isInLogsSection && isSuccess && !isDismissed

  const hasTrackedExposure = useRef(false)
  useEffect(() => {
    if (!shouldShow || hasTrackedExposure.current) return
    hasTrackedExposure.current = true
    track('logs_all_deprecation_banner_exposed')
  }, [shouldShow, track])

  if (!shouldShow) return null

  return (
    <HeaderBanner
      variant="note"
      // HeaderBanner truncates title and description to a single line each on
      // desktop, so both stay short and the detail lives in the dialog.
      title="The logs.all API endpoint is removed on September 23"
      description={
        <Dialog>
          <DialogTrigger className={cn(InlineLinkClassName, 'cursor-pointer')}>
            What's changing
          </DialogTrigger>
          <LogsAllDeprecationDialog />
        </Dialog>
      }
      onDismiss={() => {
        track('logs_all_deprecation_banner_dismissed')
        setIsDismissed(true)
      }}
    />
  )
}

const LogsAllDeprecationDialog = () => {
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>The logs.all endpoint is removed on September 23, 2026</DialogTitle>
        <DialogDescription>
          The <code className="text-xs">analytics/endpoints/logs.all</code> Management API endpoint
          stops responding after that date.
        </DialogDescription>
      </DialogHeader>

      <DialogSectionSeparator />

      <DialogSection className="flex flex-col gap-3 text-sm text-foreground-light">
        <p>
          If you query project logs from scripts, integrations, or tools, point them at{' '}
          <code className="text-xs">analytics/endpoints/logs</code> before then. The dashboard's own
          log pages are unaffected.
        </p>
        <p>
          The new endpoint runs on ClickHouse, so queries must be written in ClickHouse SQL. This is
          a query rewrite, not just a URL change.
        </p>
        <p>
          <InlineLink href={MIGRATION_GUIDE_URL}>View migration guide</InlineLink>
        </p>
      </DialogSection>

      <DialogFooter>
        <DialogClose asChild>
          <Button variant="default">Close</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  )
}
