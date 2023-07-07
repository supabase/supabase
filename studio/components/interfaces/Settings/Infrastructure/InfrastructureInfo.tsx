import Link from 'next/link'
import * as Tooltip from '@radix-ui/react-tooltip'

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
import { useFlag } from 'hooks'
import { Alert, Badge, Button, IconPackage, Input } from 'ui'
import ProjectUpgradeAlert from '../General/Infrastructure/ProjectUpgradeAlert'

const InfrastructureInfo = () => {
  const { ref } = useParams()
  const { project } = useProjectContext()
  // const { data: subscription } = useProjectSubscriptionV2Query({ projectRef: ref })
  // const isFreeProject = subscription?.plan?.id === 'free'

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
            <p className="text-sm text-scale-1000">
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
            <p className="text-scale-1000 text-sm">Information on your server provider</p>
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            <Input readOnly disabled value={project?.cloud_provider} label="Cloud provider" />
            <Input readOnly disabled value={project?.region} label="Region" />
          </ScaffoldSectionContent>
        </ScaffoldSection>
        <ScaffoldSection className="!pt-0">
          <ScaffoldSectionDetail>
            <p>Postgres</p>
            <p className="text-scale-1000 text-sm">Information on your Postgres instance</p>
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            {isLoadingUpgradeEligibility && <GenericSkeletonLoader />}
            {isErrorUpgradeEligibility && (
              <AlertError error={error} subject="Failed to retrieve Postgres version" />
            )}
            {isSuccessUpgradeEligibility && (
              <>
                <Input
                  readOnly
                  disabled
                  value={currentPgVersion}
                  label="Current version"
                  actions={[
                    isOnLatestVersion && (
                      <Tooltip.Root delayDuration={0}>
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
                                'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                'border border-scale-200 w-[200px]',
                              ].join(' ')}
                            >
                              <span className="text-xs text-scale-1200">
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
                  <Alert
                    icon={<IconPackage className="text-scale-1100" strokeWidth={1.5} />}
                    variant="neutral"
                    title="A new version of Postgres is available for your project"
                  >
                    <p className="mb-3">
                      Please reach out to us via our support form if you are keen to upgrade your
                      Postgres version to the latest available ({latestPgVersion}).
                    </p>
                    <Link
                      href={`/support/new?category=Database_unresponsive&ref=${ref}&subject=${subject}&message=${message}`}
                    >
                      <a target="_blank" rel="noreferrer">
                        <Button size="tiny" type="default">
                          Contact support
                        </Button>
                      </a>
                    </Link>
                  </Alert>
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
