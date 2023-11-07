import * as Tooltip from '@radix-ui/react-tooltip'
import Link from 'next/link'

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
import { useFlag, useIsFeatureEnabled } from 'hooks'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  Input,
} from 'ui'
import ProjectUpgradeAlert from '../General/Infrastructure/ProjectUpgradeAlert'

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
  const { current_app_version, latest_app_version, requires_manual_intervention } = data || {}
  const isOnLatestVersion = current_app_version === latest_app_version
  const currentPgVersion = (current_app_version ?? '').split('supabase-postgres-')[1]
  const latestPgVersion = (latest_app_version ?? '').split('supabase-postgres-')[1]

  const showDbUpgrades = useFlag('databaseUpgrades')
  const subject = 'Request%20for%20Postgres%20upgrade%20for%20project'
  const message = `Upgrade information:%0A• Manual intervention reason: ${requires_manual_intervention}`

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
      <ScaffoldContainer>
        <ScaffoldSection>
          <ScaffoldSectionDetail>
            <p>Configuration</p>
            <p className="text-foreground-light text-sm">Information on your server provider</p>
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            <Input readOnly disabled value={project?.cloud_provider} label="Cloud provider" />
            <Input readOnly disabled value={project?.region} label="Region" />
          </ScaffoldSectionContent>
        </ScaffoldSection>
        <ScaffoldSection className="!pt-0">
          <ScaffoldSectionDetail>
            <p>Service Versions</p>
            <p className="text-foreground-light text-sm">
              Information on your provisioned instance
            </p>
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
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
                    label="GoTrue version"
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
                          <Badge color="green" className="mr-1">
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
                                Project is on the latest version of Postgres that Supabase supports
                              </span>
                            </div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    ),
                  ]}
                />
                {showDbUpgrades && data?.eligible && <ProjectUpgradeAlert />}
                {showDbUpgrades && !data?.eligible && data?.requires_manual_intervention && (
                  <Alert_Shadcn_ title="A new version of Postgres is available for your project">
                    <AlertTitle_Shadcn_>
                      A new version of Postgres is available for your project
                    </AlertTitle_Shadcn_>
                    <AlertDescription_Shadcn_>
                      <p className="mb-3">
                        Please reach out to us via our support form if you are keen to upgrade your
                        Postgres version to the latest available ({latestPgVersion}).
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
                {showDbUpgrades &&
                  !data?.eligible &&
                  (data?.extension_dependent_objects || []).length > 0 && (
                    <Alert_Shadcn_
                      variant="warning"
                      title="A new version of Postgres is available for your project"
                    >
                      <AlertTitle_Shadcn_>New version of Postgres available</AlertTitle_Shadcn_>
                      <AlertDescription_Shadcn_ className="flex flex-col gap-3">
                        <div>
                          <p className="mb-1">
                            This project cannot be upgraded due to the following extension dependent
                            objects:
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
                          operation is complete.
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
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>
    </>
  )
}

export default InfrastructureInfo
