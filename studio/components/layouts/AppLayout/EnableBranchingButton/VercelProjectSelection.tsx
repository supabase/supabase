import { useParams } from 'common'
import { Integration } from 'data/integrations/integrations.types'
import { Badge, Button, Modal } from 'ui'

interface VercelProjectSelectionProps {
  integration?: Integration
}

const VercelProjectSelection = ({ integration }: VercelProjectSelectionProps) => {
  const { ref } = useParams()
  const vercelProjectIntegration = integration?.connections.find(
    (connection) => connection.supabase_project_ref === ref
  )

  return (
    <Modal.Content>
      <div className="space-y-1 py-6">
        <div className="flex items-center space-x-2">
          <p>Frontend Cloud Previews</p>
          <Badge color="gray">Optional</Badge>
        </div>
        <p className="text-sm text-light">
          Previews can be available by connecting your Supabase project to a Vercel project.
        </p>
        {!integration && (
          <Button type="default" className="!mt-3" onClick={() => {}}>
            Install Vercel Integration
          </Button>
        )}
        {integration && !vercelProjectIntegration && <div>Connect project</div>}
        {integration && vercelProjectIntegration && <div>Select project</div>}
      </div>
    </Modal.Content>
  )
}

export default VercelProjectSelection
