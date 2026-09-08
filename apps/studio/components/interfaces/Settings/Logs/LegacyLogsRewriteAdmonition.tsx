import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import type { LegacyLogsRewriteState } from '@/hooks/analytics/useLegacyLogsRewrite'

interface LegacyLogsRewriteAdmonitionProps {
  state: LegacyLogsRewriteState
  onRewrite: () => void
  onDismiss: () => void
}

const BANNER_CLASSES = 'mb-0 rounded-none border-x-0 border-t-0'

/**
 * Presentation for the BigQuery → ClickHouse rewrite offer, covering every state
 * of `useLegacyLogsRewrite`. Shared by the Logs Explorer and the SQL editor so the
 * copy and the outcome handling live in one place — a surface only decides *when*
 * to show this, not what each state says.
 *
 * Renders nothing once dismissed; callers can also hide it earlier if they have
 * their own reasons to (the SQL editor hides it while a diff is open).
 */
export const LegacyLogsRewriteAdmonition = ({
  state,
  onRewrite,
  onDismiss,
}: LegacyLogsRewriteAdmonitionProps) => {
  if (state.status === 'dismissed') return null

  if (state.status === 'failed') {
    return (
      <Admonition
        type="warning"
        layout="horizontal"
        className={BANNER_CLASSES}
        title="Unable to rewrite the query"
        description={state.message}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="default" size="tiny" onClick={onRewrite}>
              Try again
            </Button>
            <Button variant="text" size="tiny" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        }
      />
    )
  }

  // The dialect check is a heuristic, so an unchanged rewrite is the Assistant
  // disagreeing with it. Say so and let the user close it, rather than proposing
  // an empty diff or silently giving up.
  if (state.status === 'noRewriteNeeded') {
    return (
      <Admonition
        type="default"
        layout="horizontal"
        className={BANNER_CLASSES}
        title="No rewrite needed"
        description="The Assistant found nothing to change — this query already runs on ClickHouse."
        actions={
          <Button variant="default" size="tiny" onClick={onDismiss}>
            Dismiss
          </Button>
        }
      />
    )
  }

  const isRewriting = state.status === 'rewriting'

  return (
    <Admonition
      type="default"
      layout="horizontal"
      className={BANNER_CLASSES}
      title="Logs now run on a ClickHouse-backed engine"
      description="This query needs to be adjusted to ClickHouse SQL, which the Assistant can do for you."
      actions={
        <div className="flex items-center gap-2">
          <Button variant="default" size="tiny" loading={isRewriting} onClick={onRewrite}>
            Rewrite with Assistant
          </Button>
          {/* Disabled mid-rewrite so the offer can't be dismissed out from under
              an in-flight request — the two states stay mutually exclusive. */}
          <ButtonTooltip
            variant="text"
            size="tiny"
            disabled={isRewriting}
            onClick={onDismiss}
            tooltip={{
              content: {
                side: 'bottom',
                text: isRewriting ? 'Available once the rewrite finishes' : undefined,
              },
            }}
          >
            Dismiss
          </ButtonTooltip>
        </div>
      }
    />
  )
}
