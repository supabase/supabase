import * as Tooltip from '@radix-ui/react-tooltip'
import { useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  Input,
} from 'ui'

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
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useIsFeatureEnabled } from 'hooks'
import { AWS_REGIONS, FLY_REGIONS } from 'lib/constants'
import { ProjectUpgradeAlert } from '../General/Infrastructure/ProjectUpgradeAlert'
import InstanceConfiguration from './InfrastructureConfiguration/InstanceConfiguration'
import {
  AWS_REGIONS_VALUES,
  FLY_REGIONS_VALUES,
} from './InfrastructureConfiguration/InstanceConfiguration.constants'

const InfrastructureInfo = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { project, isLoading } = useProjectContext()

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
  const { data: databases } = useReadReplicasQuery({ projectRef: ref })
  const { current_app_version, latest_app_version, requires_manual_intervention } = data || {}
  const isOnLatestVersion = current_app_version === latest_app_version
  const currentPgVersion = (current_app_version ?? '').split('supabase-postgres-')[1]
  const latestPgVersion = (latest_app_version ?? '').split('supabase-postgres-')[1]

  const isInactive = project?.status === 'INACTIVE'
  const showReadReplicasUI = project?.is_read_replicas_enabled
  const hasReadReplicas = (databases ?? []).length > 1
  const subject = 'Request%20for%20Postgres%20upgrade%20for%20project'
  const message = `Upgrade information:%0A• Manual intervention reason: ${requires_manual_intervention}`

  const [regionKey] =
    project?.cloud_provider === 'AWS'
      ? Object.entries(AWS_REGIONS_VALUES).find(([key, region]) => region === project?.region) ?? []
      : Object.entries(FLY_REGIONS_VALUES).find(([key, region]) => region === project?.region) ?? []
  const region =
    project?.cloud_provider === 'AWS'
      ? AWS_REGIONS[regionKey as keyof typeof AWS_REGIONS]
      : FLY_REGIONS[regionKey as keyof typeof FLY_REGIONS]

  return (
    <>
      <ScaffoldContainer>
        <div className="mx-auto flex flex-col gap-10 py-6">
          <div>
            <p className="text-xl">Infrastructure</p>
            <p className="text-sm text-foreground-light">
              General information regarding your server instance
            </p>
          </div>
        </div>
      </ScaffoldContainer>

      <ScaffoldDivider />

      {showReadReplicasUI && (
        <>
          <InstanceConfiguration />
          <ScaffoldDivider />
        </>
      )}

      <ScaffoldContainer>
        {!showReadReplicasUI && (
          <ScaffoldSection>
            <ScaffoldSectionDetail>
              <p>Configuration</p>
              <p className="text-foreground-light text-sm">Information on your server provider</p>
            </ScaffoldSectionDetail>
            <ScaffoldSectionContent>
              {isLoading ? (
                <GenericSkeletonLoader />
              ) : (
                <>
                  <Input readOnly disabled value={project?.cloud_provider} label="Cloud provider" />
                  <Input
                    readOnly
                    disabled
                    icon={
                      regionKey !== undefined ? (
                        <img
                          alt="region icon"
                          className="w-5 rounded-sm"
                          src={`${router.basePath}/img/regions/${regionKey}.svg`}
                        />
                      ) : null
                    }
                    value={
                      region !== undefined ? `${region} (${project?.region})` : project?.region
                    }
                    label="Region"
                  />
                </>
              )}
            </ScaffoldSectionContent>
          </ScaffoldSection>
        )}
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
                    {authEnabled && (
                      <Input
                        readOnly
                        disabled
                        label="Auth version"
                        value={project?.serviceVersions?.gotrue ?? ''}
                      />
                    )}
                    <Input
                      readOnly
                      disabled
                      label="PostgREST version"
                      value={project?.serviceVersions?.postgrest ?? ''}
                    />
                    <Input
                      readOnly
                      disabled
                      value={currentPgVersion}
                      label="Postgres version"
                      actions={[
                        isOnLatestVersion && (
                          <Tooltip.Root key="tooltip-latest" delayDuration={0}>
                            <Tooltip.Trigger>
                              <Badge variant="brand" className="mr-1">
                                Latest
                              </Badge>
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Content side="bottom">
                                <Tooltip.Arrow className="radix-tooltip-arrow" />
                                <div
                                  className={[
                                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                                    'border border-background w-[200px]',
                                  ].join(' ')}
                                >
                                  <span className="text-xs text-foreground">
                                    Project is on the latest version of Postgres that Supabase
                                    supports
                                  </span>
                                </div>
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        ),
                      ]}
                    />
                    {data?.eligible && !hasReadReplicas && <ProjectUpgradeAlert />}
                    {data.eligible && hasReadReplicas && (
                      <Alert_Shadcn_>
                        <AlertTitle_Shadcn_>
                          A new version of Postgres is available for your project
                        </AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_>
                          You will need to remove all read replicas first prior to upgrading your
                          Postgrest version to the latest available ({latestPgVersion}).
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
                    )}
                    {!data?.eligible && data?.requires_manual_intervention && (
                      <Alert_Shadcn_ title="A new version of Postgres is available for your project">
                        <AlertTitle_Shadcn_>
                          A new version of Postgres is available for your project
                        </AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_>
                          <p className="mb-3">
                            Please reach out to us via our support form if you are keen to upgrade
                            your Postgres version to the latest available ({latestPgVersion}).
                          </p>
                          <Button size="tiny" type="default" asChild>
                            <Link
                              href={`/support/new?category=Database_unresponsive&ref=${ref}&subject=${subject}&message=${message}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Contact support
                            </Link>
                          </Button>
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
                    )}
                    {!data?.eligible && (data?.extension_dependent_objects || []).length > 0 && (
                      <Alert_Shadcn_
                        variant="warning"
                        title="A new version of Postgres is available for your project"
                      >
                        <AlertTitle_Shadcn_>New version of Postgres available</AlertTitle_Shadcn_>
                        <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                          <div>
                            <p className="mb-1">
                              This project cannot be upgraded due to the following extension
                              dependent objects:
                            </p>

                            <ul className="pl-4">
                              {(data?.extension_dependent_objects || []).map((obj) => (
                                <li className="list-disc" key={obj}>
                                  {obj}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <p>
                            Once the above objects are exported and removed, you can proceed to
                            upgrade your project, and re-import the objects after the upgrade
                            operation is complete. Please refer to the docs on additional extensions
                            that might also need to be dropped.
                          </p>
                          <div>
                            <Button size="tiny" type="default" asChild>
                              <Link
                                href="https://supabase.com/docs/guides/platform/migrating-and-upgrading-projects#caveats"
                                target="_blank"
                                rel="noreferrer"
                              >
                                View docs
                              </Link>
                            </Button>
                          </div>
                        </AlertDescription_Shadcn_>
                      </Alert_Shadcn_>
                    )}
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
