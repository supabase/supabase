import Link from 'next/link'
import { Button, Card, CardContent } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import PauseProjectButton from './Infrastructure/PauseProjectButton'
import RestartServerButton from './Infrastructure/RestartServerButton'
import { ResumeProjectButton } from '@/components/interfaces/Project/ResumeProjectButton'
import { useProjectPauseStatusQuery } from '@/data/projects/project-pause-status-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { PROJECT_STATUS } from '@/lib/constants'

export const Project = () => {
  const { data: project } = useSelectedProjectQuery()
  const isPaused = project?.status === PROJECT_STATUS.INACTIVE
  const { projectSettingsRestartProject } = useIsFeatureEnabled([
    'project_settings:restart_project',
  ])
  const {
    data: pauseStatus,
    isError: isPauseStatusError,
    isSuccess: isPauseStatusSuccess,
  } = useProjectPauseStatusQuery({ ref: project?.ref }, { enabled: isPaused })

  const shouldShowDashboardLink =
    isPaused && (isPauseStatusError || (isPauseStatusSuccess && !pauseStatus.can_restore))

  const primaryActionLabel = isPaused
    ? shouldShowDashboardLink
      ? 'View project dashboard'
      : 'Resume project'
    : projectSettingsRestartProject
      ? 'Restart project'
      : 'Restart database'

  const primaryActionDescription = isPaused
    ? isPauseStatusSuccess && !pauseStatus.can_restore
      ? 'This project can no longer be resumed here. Open the dashboard to download backups and view recovery options.'
      : isPauseStatusError
        ? 'Open the dashboard to manage this paused project.'
        : 'Bring your paused project back online.'
    : 'Your project will not be available for a few minutes.'

  return (
    <>
      <PageSection id="restart-project">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Project availability</PageSectionTitle>
            <PageSectionDescription>
              {isPaused
                ? 'Resume your paused project or review recovery options'
                : 'Restart or pause your project when performing maintenance'}
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent>
              <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4">
                <div>
                  <p className="text-sm">{primaryActionLabel}</p>
                  <div className="max-w-[420px]">
                    <p className="text-sm text-foreground-light">{primaryActionDescription}</p>
                  </div>
                </div>
                {isPaused ? (
                  shouldShowDashboardLink ? (
                    <Button asChild type="default">
                      <Link href={`/project/${project?.ref}`}>View project dashboard</Link>
                    </Button>
                  ) : (
                    <ResumeProjectButton />
                  )
                ) : (
                  <RestartServerButton />
                )}
              </div>
            </CardContent>
            {!isPaused && (
              <CardContent>
                <div
                  className="flex w-full flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4"
                  id="pause-project"
                >
                  <div>
                    <p className="text-sm">Pause project</p>
                    <div className="max-w-[420px]">
                      <p className="text-sm text-foreground-light">
                        Your project will not be accessible while it is paused.
                      </p>
                    </div>
                  </div>
                  <PauseProjectButton />
                </div>
              </CardContent>
            )}
          </Card>
        </PageSectionContent>
      </PageSection>
    </>
  )
}
