import Link from 'next/link'

import { useFlag, useParams } from 'common'
import { NoticeBar } from 'components/interfaces/DiskManagement/ui/NoticeBar'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { useProjectUpgradeEligibilityQuery } from 'data/config/project-upgrade-eligibility-query'
import { useProjectServiceVersionsQuery } from 'data/projects/project-service-versions'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useIsOrioleDb, useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { Badge, Button, Input, Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { ProjectUpgradeAlert } from '../General/Infrastructure/ProjectUpgradeAlert'
import { InstanceConfiguration } from './InfrastructureConfiguration/InstanceConfiguration'
import { ReadReplicasWarning, ValidationErrorsWarning } from './UpgradeWarnings'

export const InfrastructureInfo = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()

  const unifiedReplication = useFlag('unifiedReplication')

  const { projectAuthAll: authEnabled, projectSettingsDatabaseUpgrades: showDatabaseUpgrades } =
    useIsFeatureEnabled(['project_auth:all', 'project_settings:database_upgrades'])

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

  const hasValidationErrors = (data?.validation_errors ?? []).length > 0

  return (
    <>
      <ScaffoldDivider />
      {project?.cloud_provider !== 'FLY' &&
        (unifiedReplication ? (
          <ScaffoldContainer>
            <ScaffoldSection isFullWidth>
              <NoticeBar
                visible={true}
                type="default"
                title="Management of read replicas has moved"
                description="Read replicas is now managed under Replication in the Database section."
                actions={
                  <Button type="default" asChild>
                    <Link href={`/project/${ref}/database/replication`} className="!no-underline">
                      Go to Replication
                    </Link>
                  </Button>
                }
              />
            </ScaffoldSection>
          </ScaffoldContainer>
        ) : (
          <>
            <InstanceConfiguration />
            <ScaffoldDivider />
          </>
        ))}

      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail>
            <h4 className="text-base capitalize m-0">Service versions</h4>
            <p className="text-foreground-light text-sm pr-8 mt-1">
              Service versions and upgrade eligibility for your provisioned instance.
            </p>
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            {isInactive ? (
              <Admonition
                type="note"
                showIcon={false}
                title="Service versions cannot be retrieved while project is paused"
                description="Restoring the project will update Postgres to the newest version"
              />
            ) : (
              <>
                {/* [Joshen] Double check why we need this waterfall loading behaviour here */}
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
                          <Input
                            readOnly
                            disabled
                            label="Auth version"
                            value={serviceVersions?.gotrue ?? ''}
                          />
                        )}
                        <Input
                          readOnly
                          disabled
                          label="PostgREST version"
                          value={serviceVersions?.postgrest ?? ''}
                        />
                        <Input
                          readOnly
                          disabled
                          value={currentPgVersion || serviceVersions?.['supabase-postgres'] || ''}
                          label="Postgres version"
                          actions={[
                            isVisibleReleaseChannel && (
                              <Tooltip>
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
                              <Tooltip>
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
                              <Tooltip>
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
                        />
                      </>
                    )}

                    {showDatabaseUpgrades && data && data.eligible ? (
                      hasReadReplicas ? (
                        <ReadReplicasWarning latestPgVersion={latestPgVersion} />
                      ) : (
                        <ProjectUpgradeAlert />
                      )
                    ) : null}

                    {showDatabaseUpgrades && data && !data.eligible && hasValidationErrors ? (
                      <ValidationErrorsWarning validationErrors={data.validation_errors ?? []} />
                    ) : null}
                  </>
                )}
              </>
            )}
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}
