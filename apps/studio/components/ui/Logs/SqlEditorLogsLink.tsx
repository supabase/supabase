import { getSqlEditorLogsUrl } from './sqlEditorLogsLink.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useTrack } from '@/lib/telemetry/track'

export type SqlEditorLogsLinkProps = {
  projectRef: string
  /** When the run resolved, as epoch millis. */
  executedAt: number
}

/**
 * Points a successful-but-empty SQL editor result at the Postgres logs for that
 * run. Results carry no notices or warnings — pg-meta returns rows only — so a
 * statement that raised one reads as a plain success in the panel.
 */
export const SqlEditorLogsLink = ({ projectRef, executedAt }: SqlEditorLogsLinkProps) => {
  const isLogsEnabled = useIsFeatureEnabled('logs:all')
  const track = useTrack()

  if (!isLogsEnabled) return null

  return (
    <p className="text-sm text-foreground-light">
      Notices and warnings only appear in the{' '}
      <InlineLink
        href={getSqlEditorLogsUrl({ projectRef, executedAt })}
        onClick={() => track('sql_editor_view_logs_clicked')}
      >
        Postgres logs
      </InlineLink>
      .
    </p>
  )
}
