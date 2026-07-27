import { useParams } from 'common'
import { ExternalLink } from 'lucide-react'
import { Admonition } from 'ui-patterns/admonition'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { DownloadBackupsSection } from './DownloadBackupsSection'
import { InlineLink } from '@/components/ui/InlineLink'
import { useProjectPauseStatusQuery } from '@/data/projects/project-pause-status-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL, PROJECT_STATUS } from '@/lib/constants'
import { formatRestoreWindow } from '@/lib/helpers'

export const PauseDisabledState = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { data: pauseStatus } = useProjectPauseStatusQuery(
    { ref },
    { enabled: project?.status === PROJECT_STATUS.INACTIVE }
  )

  return (
    <>
      <Admonition
        showIcon={false}
        type="warning"
        className="rounded-none border-0 px-6 [&>div>div>div]:flex [&>div>div>div]:flex-col [&>div>div>div]:gap-y-3"
        title="Project can no longer be restored through the dashboard"
      >
        <p className="leading-normal!">
          This project has been paused for over{' '}
          <span className="text-foreground">
            {formatRestoreWindow(pauseStatus?.max_days_till_restore_disabled ?? 365)}
          </span>{' '}
          and cannot be restored through the dashboard. However, your data remains intact and can be
          downloaded as a backup.
        </p>

        {!!pauseStatus?.last_paused_on && (
          <p className="text-foreground-lighter text-sm">
            Project last paused on{' '}
            <TimestampInfo
              className="text-sm"
              labelFormat="DD MMM YYYY"
              utcTimestamp={pauseStatus.last_paused_on}
            />
          </p>
        )}

        <div>
          <p className="leading-normal! mb-1!">Recovery options:</p>
          <ul className="flex flex-col gap-y-0.5">
            <li className="flex items-center gap-x-2">
              <ExternalLink size={14} />
              <InlineLink
                href={`${DOCS_URL}/guides/platform/migrating-within-supabase/dashboard-restore`}
              >
                Restore the backup to a new Supabase project
              </InlineLink>
            </li>
            <li className="flex items-center gap-x-2">
              <ExternalLink size={14} />
              <InlineLink href={`${DOCS_URL}/guides/local-development/restoring-downloaded-backup`}>
                Restore the backup on your local machine
              </InlineLink>
            </li>
          </ul>
        </div>
      </Admonition>
      <DownloadBackupsSection />
    </>
  )
}
