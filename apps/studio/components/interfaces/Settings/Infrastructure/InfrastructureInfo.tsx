import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import {
  ScaffoldContainer,
  ScaffoldDivider,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import AlertError from 'components/ui/AlertError'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { useProjectUpgradeEligibilityQuery } from 'data/config/project-upgrade-eligibility-query'
import { useProjectServiceVersionsQuery } from 'data/projects/project-service-versions'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useIsOrioleDb } from 'hooks/misc/useSelectedProject'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Input,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ProjectUpgradeAlert } from '../General/Infrastructure/ProjectUpgradeAlert'
import InstanceConfiguration from './InfrastructureConfiguration/InstanceConfiguration'
import {
  ObjectsToBeDroppedWarning,
  ReadReplicasWarning,
  UnsupportedExtensionsWarning,
  UserDefinedObjectsInInternalSchemasWarning,
} from './UpgradeWarnings'

const InfrastructureInfo = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()

  const authEnabled = useIsFeatureEnabled('project_auth:all')

  const {
    data,
    error,
    isLoading: isLoadingUpgradeEligibility,
    isError: isErrorUpgradeEligibility,
    isSuccess: isSuccessUpgradeEligibility,
  } = useProjectUpgradeEligibilityQuery({
    projectRef: ref,
  })

  const {
    data: serviceVersions,
    error: serviceVersionsError,
    isLoading: isLoadingServiceVersions,
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
  const isOnNonGenerallyAvailableReleaseChannel =
    current_app_version_release_channel && current_app_version_release_channel !== 'ga'
      ? current_app_version_release_channel
      : undefined
  const isOrioleDb = useIsOrioleDb()
  const latestPgVersion = (latest_app_version ?? '').split('supabase-postgres-')[1]

  const isInactive = project?.status === 'INACTIVE'
  const hasReadReplicas = (databases ?? []).length > 1

  const hasObjectsToBeDropped = (data?.objects_to_be_dropped ?? []).length > 0
  const hasUnsupportedExtensions = (data?.unsupported_extensions || []).length > 0
  const hasObjectsInternalSchema = (data?.user_defined_objects_in_internal_schemas || []).length > 0

  return (
    <>
      <ScaffoldDivider />
      {project?.cloud_provider !== 'FLY' && (
        <>
          <InstanceConfiguration />
          <ScaffoldDivider />
        </>
      )}

      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail>
            <p>Service Versions</p>
            <p className="text-foreground-light text-sm">
              Information on your provisioned instance
            </p>
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            {isInactive ? (
              <Alert_Shadcn_>
                <AlertTitle_Shadcn_>
                  Service versions cannot be retrieved while project is paused
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  Restoring the project will update Postgres to the newest version
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
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
                            isOnNonGenerallyAvailableReleaseChannel && (
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge variant="warning" className="mr-1 capitalize">
                                    {isOnNonGenerallyAvailableReleaseChannel}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent side="bottom" className="w-44 text-center">
                                  This project uses a {isOnNonGenerallyAvailableReleaseChannel}{' '}
                                  database version release
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
                                  <Badge variant="brand" className="mr-1">
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

                    {data.eligible ? (
                      hasReadReplicas ? (
                        <ReadReplicasWarning latestPgVersion={latestPgVersion} />
                      ) : (
                        <ProjectUpgradeAlert />
                      )
                    ) : null}

                    {!data.eligible ? (
                      hasObjectsToBeDropped ? (
                        <ObjectsToBeDroppedWarning
                          objectsToBeDropped={data.objects_to_be_dropped}
                        />
                      ) : hasUnsupportedExtensions ? (
                        <UnsupportedExtensionsWarning
                          unsupportedExtensions={data.unsupported_extensions}
                        />
                      ) : hasObjectsInternalSchema ? (
                        <UserDefinedObjectsInInternalSchemasWarning
                          objects={data.user_defined_objects_in_internal_schemas}
                        />
                      ) : null
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

export default InfrastructureInfo
