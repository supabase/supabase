import { BarChart2 } from 'lucide-react'
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
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const Project = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const isBranch = Boolean(project?.parent_project_ref)
  const { projectSettingsRestartProject } = useIsFeatureEnabled([
    'project_settings:restart_project',
  ])

  return (
    <>
      <PageSection id="restart-project">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Project availability</PageSectionTitle>
            <PageSectionDescription>
              Restart or pause your project when performing maintenance
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent>
              <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4">
                <div>
                  <p className="text-sm">
                    {projectSettingsRestartProject ? 'Restart project' : 'Restart database'}
                  </p>
                  <div className="max-w-[420px]">
                    <p className="text-sm text-foreground-light">
                      Your project will not be available for a few minutes.
                    </p>
                  </div>
                </div>
                <RestartServerButton />
              </div>
            </CardContent>
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
          </Card>
        </PageSectionContent>
      </PageSection>

      {!isBranch && (
        <PageSection>
          <PageSectionMeta>
            <PageSectionSummary>
              <PageSectionTitle>Project usage</PageSectionTitle>
            </PageSectionSummary>
          </PageSectionMeta>
          <PageSectionContent>
            <Card>
              <CardContent>
                <div className="flex flex-col @lg:flex-row @lg:justify-between @lg:items-center gap-4">
                  <div className="flex space-x-4">
                    <BarChart2 strokeWidth={2} />
                    <div>
                      <p className="text-sm">Project usage statistics have been moved</p>
                      <p className="text-foreground-light text-sm">
                        You may view your project's usage under your organization's settings
                      </p>
                    </div>
                  </div>

                  {!!organization && !!project && (
                    <Button asChild type="default">
                      <Link href={`/org/${organization.slug}/usage?projectRef=${project.ref}`}>
                        View project usage
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </PageSectionContent>
        </PageSection>
      )}
    </>
  )
}
