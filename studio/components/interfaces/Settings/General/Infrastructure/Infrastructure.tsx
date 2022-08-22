import { FC } from 'react'
import { Input } from '@supabase/ui'
import { observer } from 'mobx-react-lite'

import { useStore, useFlag } from 'hooks'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import {
  FormHeader,
  FormPanel,
  FormSection,
  FormSectionLabel,
  FormSectionContent,
} from 'components/ui/Forms'
import PauseProjectButton from './PauseProjectButton'
import RestartServerButton from './RestartServerButton'

interface Props {}

const Infrastructure: FC<Props> = ({}) => {
  const { ui } = useStore()
  const isProjectPauseEnabled = useFlag('projectPausing')

  const project = ui.selectedProject
  const isFreeProject = project?.subscription_tier === PRICING_TIER_PRODUCT_IDS.FREE

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
                  <p className="text-scale-1100 text-sm">
                    Your project will not be available for a few minutes.
                  </p>
                </div>
              </div>
              {project && <RestartServerButton project={project} />}
            </div>

            {isProjectPauseEnabled && isFreeProject && (
              <>
                <div className="border-t border-scale-400" />
                <div className="flex w-full items-center justify-between px-8 py-4">
                  <div>
                    <p className="text-sm">Pause project</p>
                    <div className="max-w-[420px]">
                      <p className="text-scale-1100 text-sm">
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
      </FormPanel>
    </div>
  )
}

export default observer(Infrastructure)
