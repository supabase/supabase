import { FormHeader } from 'components/ui/Forms/FormHeader'
import Panel from 'components/ui/Panel'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import TransferProjectButton from './TransferProjectButton'
import { Truck } from 'lucide-react'

const TransferProjectPanel = () => {
  const project = useSelectedProject()

  if (project === undefined) return <></>

  return (
    <section id="transfer-project">
      <FormHeader
        title="Transfer Project"
        description="Transfer your project to a different organization."
      />
      <Panel>
        <Panel.Content>
          <div className="flex justify-between items-center gap-8">
            <div className="flex space-x-4">
              <Truck className="mt-1" />
              <div className="space-y-1 xl:max-w-lg">
                <p className="text-sm">Transfer project to another organization</p>
                <p className="text-sm text-foreground-light">
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
