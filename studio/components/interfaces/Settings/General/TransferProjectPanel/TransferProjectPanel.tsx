import { FC } from 'react'

import { useSelectedProject } from 'hooks'
import Panel from 'components/ui/Panel'

import TransferProjectButton from './TransferProjectButton'
import { FormHeader } from 'components/ui/Forms'
import { IconTruck } from 'ui'

interface Props {}

const TransferProjectPanel: FC<Props> = ({}) => {
  const project = useSelectedProject()

  if (project === undefined) return <></>

  return (
    <section>
      <FormHeader
        title="Transfer Project"
        description="Transfer your project to a different organization with no downtime."
      />
      <Panel>
        <Panel.Content>
          <div className="flex justify-between items-center gap-8">
            <div className="flex space-x-4">
              <IconTruck className="mt-1" />
              <div className="space-y-1 xl:max-w-lg">
                <p className="text-sm">Transfer project to another organization</p>
                <p className="text-sm text-scale-1100">
                  To transfer projects, the owner must be a member of both the source and target
                  organizations.
                </p>
              </div>
            </div>
            <div>
              <TransferProjectButton />
            </div>
          </div>
        </Panel.Content>
      </Panel>
    </section>
  )
}

export default TransferProjectPanel
