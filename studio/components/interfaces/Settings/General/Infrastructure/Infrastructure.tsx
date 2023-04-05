import Link from 'next/link'
import { FC } from 'react'
import { Alert, Badge, Button, IconPackage, Input } from 'ui'
import { observer } from 'mobx-react-lite'
import * as Tooltip from '@radix-ui/react-tooltip'

import { useFlag, useStore } from 'hooks'
import { useParams } from 'common/hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import {
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionLabel,
  FormSectionContent,
} from 'components/ui/Forms'
import ProjectUpgradeAlert from './ProjectUpgradeAlert'
import PauseProjectButton from './PauseProjectButton'
import RestartServerButton from './RestartServerButton'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useProjectUpgradeEligibilityQuery } from 'data/config/project-upgrade-eligibility-query'

interface Props {}

const Infrastructure: FC<Props> = ({}) => {
  const { ui } = useStore()
  const { ref } = useParams()

  const project = ui.selectedProject
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef: ref })
  const isFreeProject = subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.FREE

  const { data, isLoading } = useProjectUpgradeEligibilityQuery({ projectRef: ref })
  const { current_app_version, latest_app_version, requires_manual_intervention } = data || {}
  const isOnLatestVersion = current_app_version === latest_app_version
  const currentPgVersion = (current_app_version ?? '').split('supabase-postgres-')[1]
  const latestPgVersion = (latest_app_version ?? '').split('supabase-postgres-')[1]

  const showDbUpgrades = useFlag('databaseUpgrades')
  const subject = 'Request%20for%20Postgres%20upgrade%20for%20project'
  const message = `Upgrade information:%0A• Manual intervention reason: ${requires_manual_intervention}`

  return (
    <div>
      <FormHeader title="Infrastructure" description="" />
      <FormPanel
        footer={
          <>
            <div className="flex w-full items-center justify-between px-8 py-4">
              <div>
                <p className="text-sm">Restart server</p>
                <div className="max-w-[420px]">
                  <p className="text-sm text-scale-1100">
                    Your project will not be available for a few minutes.
                  </p>
                </div>
              </div>
              {project && <RestartServerButton project={project} />}
            </div>

            {isFreeProject && (
              <>
                <div className="border-t border-scale-400" />
                <div className="flex w-full items-center justify-between px-8 py-4">
                  <div>
                    <p className="text-sm">Pause project</p>
                    <div className="max-w-[420px]">
                      <p className="text-sm text-scale-1100">
                        Your project will not be accessible while it is paused.
                      </p>
                    </div>
                  </div>
                  {project && (
                    <PauseProjectButton projectId={project.id} projectRef={project.ref} />
                  )}
                </div>
              </>
            )}
          </>
        }
      >
        <FormSection header={<FormSectionLabel>Configuration</FormSectionLabel>}>
          <FormSectionContent loading={project === undefined}>
            <Input readOnly disabled value={project?.cloud_provider} label="Cloud provider" />
            <Input readOnly disabled value={project?.region} label="Region" />
          </FormSectionContent>
        </FormSection>

        <FormSection header={<FormSectionLabel>Postgres</FormSectionLabel>}>
          <FormSectionContent loading={isLoading}>
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
                  <a target="_blank">
                    <Button size="tiny" type="default">
                      Contact support
                    </Button>
                  </a>
                </Link>
              </Alert>
            )}
          </FormSectionContent>
        </FormSection>
      </FormPanel>
    </div>
  )
}

export default observer(Infrastructure)
