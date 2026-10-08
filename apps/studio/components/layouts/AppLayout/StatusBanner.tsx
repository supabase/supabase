import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { getBannerCopy, type BannerSelection } from './StatusBanner.utils'
import { useStatusBanner } from './useStatusBanner'
import { HeaderBanner } from '@/components/interfaces/Organization/HeaderBanner'
import { InlineLink } from '@/components/ui/InlineLink'

const OVERRIDE_TITLE = 'We are investigating a technical issue'

const TIMESTAMP_FORMAT = 'DD MMM, HH:mm'

function formatTimestampLabel(value: string): string {
  return dayjs(value).format(TIMESTAMP_FORMAT)
}

function getBannerDescription({
  selection,
  description,
  pageUrl,
}: {
  selection: BannerSelection
  description: string
  pageUrl: string
}): ReactNode {
  if (selection.kind === 'incident') {
    return (
      <>
        Follow the <InlineLink href={pageUrl}>status page</InlineLink> for updates
      </>
    )
  }

  if (selection.kind === 'maintenance') {
    const { scheduledEndAt } = selection.item
    const hasFutureEnd = scheduledEndAt !== null && new Date(scheduledEndAt).getTime() > Date.now()
    return (
      <>
        {description}
        {hasFutureEnd && (
          <>
            {' '}
            (
            <TimestampInfo
              utcTimestamp={scheduledEndAt}
              label={formatTimestampLabel(scheduledEndAt)}
            />
            )
          </>
        )}
      </>
    )
  }

  const { startsAt, endsAt } = selection.item
  return (
    <>
      {description}
      {startsAt !== null && endsAt !== null && (
        <>
          {' '}
          (<TimestampInfo utcTimestamp={startsAt} label={formatTimestampLabel(startsAt)} />
          {' – '}
          <TimestampInfo utcTimestamp={endsAt} label={formatTimestampLabel(endsAt)} />)
        </>
      )}
    </>
  )
}

/**
 * Global banner for incident.io status page items — a relevant active incident,
 * in-progress maintenance, or upcoming maintenance, in that priority order.
 * Replaces the legacy StatusPageBanner while `incidentIoStatusPage` is on.
 */
export const StatusBanner = ({ signedOut = false }: { signedOut?: boolean } = {}) => {
  const state = useStatusBanner({ signedOut })

  if (state.type === 'hidden') return null

  if (state.type === 'override') {
    return (
      <HeaderBanner
        variant="warning"
        title={OVERRIDE_TITLE}
        description={
          <>
            Follow the <InlineLink href="https://status.supabase.com">status page</InlineLink> for
            updates
          </>
        }
      />
    )
  }

  const { selection, pageUrl, onDismiss } = state
  const { title, description } = getBannerCopy(selection)

  return (
    <HeaderBanner
      variant={selection.kind === 'incident' ? 'warning' : 'note'}
      title={title}
      description={getBannerDescription({ selection, description, pageUrl })}
      onDismiss={onDismiss}
    />
  )
}
