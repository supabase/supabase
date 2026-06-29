import { useParams } from 'common'
import {
  Badge,
  Card,
  CardContent,
  Input,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { ProjectUpgradeAlert } from '../../General/Infrastructure/ProjectUpgradeAlert'
import {
  ReadReplicasWarning,
  ValidationErrorsWarning,
  ValidationWarningsAdmonition,
} from '../../Infrastructure/UpgradeWarnings'
import AlertError from '@/components/ui/AlertError'
import { useProjectUpgradeEligibilityQuery } from '@/data/config/project-upgrade-eligibility-query'
import { useProjectServiceVersionsQuery } from '@/data/projects/project-service-versions'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useIsOrioleDb, useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const ServiceVersionsSection = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const { projectAuthAll: authEnabled, projectSettingsDatabaseUpgrades: showDatabaseUpgrades } =
    useIsFeatureEnabled([
      'project_auth:all',
      'project_settings:database_upgrades',
      'database:replication',
    ])

  const {
    data,
    error,
    isPending: isLoadingUpgradeEligibility,
    isError: isErrorUpgradeEligibility,
    isSuccess: isSuccessUpgradeEligibility,
  } = useProjectUpgradeEligibilityQuery({
    projectRef: ref,
  })

  const {
    data: serviceVersions,
    error: serviceVersionsError,
    isPending: isLoadingServiceVersions,
    isError: isErrorServiceVersions,
    isSuccess: isSuccessServiceVersions,
  } = useProjectServiceVersionsQuery({ projectRef: ref })

  const { data: databases } = useReadReplicasQuery({ projectRef: ref })
  const { current_app_version, current_app_version_release_channel, latest_app_version } =
    data || {}

  const isOnLatestVersion = current_app_version === latest_app_version
  const currentPgVersion = (current_app_version ?? '')
    .split('supabase-postgres-')[1]
    ?.replace('-orioledb', '')
  const isVisibleReleaseChannel =
    current_app_version_release_channel &&
    !['ga', 'withdrawn'].includes(current_app_version_release_channel)
      ? current_app_version_release_channel
      : undefined
  const isOrioleDb = useIsOrioleDb()
  const latestPgVersion = (latest_app_version ?? '').split('supabase-postgres-')[1]

  const isInactive = project?.status === 'INACTIVE'
  const hasReadReplicas = (databases ?? []).length > 1

  return (
    <PageSection id="service-versions">
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Service versions</PageSectionTitle>
          <PageSectionDescription>
            Service versions and upgrade eligibility for your provisioned instance.
          </PageSectionDescription>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent className="flex flex-col gap-6">
            {isInactive ? (
              <Admonition
                type="note"
                showIcon={false}
                title="Service versions cannot be retrieved while project is paused"
                description="Restoring the project will update Postgres to the newest version"
              />
            ) : (
              <>
                {isLoadingUpgradeEligibility && <GenericSkeletonLoader />}
                {isErrorUpgradeEligibility && (
                  <AlertError error={error} subject="Failed to retrieve Postgres version" />
                )}
                {isSuccessUpgradeEligibility && (
                  <>
                    {isLoadingServiceVersions && <GenericSkeletonLoader />}
                    {isErrorServiceVersions && (
                      <AlertError
                        error={serviceVersionsError}
                        subject="Failed to retrieve versions"
                      />
                    )}
                    {isSuccessServiceVersions && (
                      <>
                        {authEnabled && (
                          <FormItemLayout
                            label="Auth version"
                            layout="vertical"
                            isReactForm={false}
                          >
                            <Input readOnly disabled value={serviceVersions?.gotrue ?? ''} />
                          </FormItemLayout>
                        )}
                        <FormItemLayout
                          label="PostgREST version"
                          layout="vertical"
                          isReactForm={false}
                        >
                          <Input readOnly disabled value={serviceVersions?.postgrest ?? ''} />
                        </FormItemLayout>
                        <FormItemLayout
                          label="Postgres version"
                          layout="vertical"
                          isReactForm={false}
                        >
                          <InputGroup>
                            <InputGroupInput
                              readOnly
                              disabled
                              value={
                                currentPgVersion || serviceVersions?.['supabase-postgres'] || ''
                              }
                            />
                            <InputGroupAddon align="inline-end">
                              {[
                                isVisibleReleaseChannel && (
                                  <Tooltip key="release-channel">
                                    <TooltipTrigger>
                                      <Badge variant="warning" className="mr-1">
                                        {isVisibleReleaseChannel}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="w-44 text-center">
                                      This project uses a {isVisibleReleaseChannel} database version
                                      release
                                    </TooltipContent>
                                  </Tooltip>
                                ),
                                isOrioleDb && (
                                  <Tooltip key="orioledb">
                                    <TooltipTrigger>
                                      <Badge variant="default" className="mr-1">
                                        OrioleDB
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="w-44 text-center">
                                      This project uses OrioleDB
                                    </TooltipContent>
                                  </Tooltip>
                                ),
                                isOnLatestVersion && (
                                  <Tooltip key="latest-version">
                                    <TooltipTrigger>
                                      <Badge variant="success" className="mr-1">
                                        Latest
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent side="bottom" className="w-52 text-center">
                                      Project is on the latest version of Postgres that Supabase
                                      supports
                                    </TooltipContent>
                                  </Tooltip>
                                ),
                              ]}
                            </InputGroupAddon>
                          </InputGroup>
                        </FormItemLayout>
                      </>
                    )}

                    {showDatabaseUpgrades && data && data.eligible ? (
                      hasReadReplicas ? (
                        <ReadReplicasWarning latestPgVersion={latestPgVersion} />
                      ) : (
                        <ProjectUpgradeAlert />
                      )
                    ) : null}

                    {showDatabaseUpgrades && data && !data.eligible && (
                      <ValidationErrorsWarning validationErrors={data.validation_errors} />
                    )}

                    {showDatabaseUpgrades && data && data.warnings && (
                      <ValidationWarningsAdmonition warnings={data.warnings} />
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
