import { FC } from 'react'
import { Input } from 'ui'
import { observer } from 'mobx-react-lite'

import { useFlag, useParams, useStore } from 'hooks'
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
  const currentPgVersion = (data?.current_app_version ?? '').split('supabase-postgres-')[1]

  const showDbUpgrades = useFlag('databaseUpgrades')

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
            <Input readOnly disabled value={currentPgVersion} label="Current version" />
            {data?.eligible && showDbUpgrades && <ProjectUpgradeAlert />}
          </FormSectionContent>
        </FormSection>
      </FormPanel>
    </div>
  )
}

export default observer(Infrastructure)
