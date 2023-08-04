import { useParams } from 'common'
import { Badge, Button, Modal } from 'ui'

import { Integration } from 'data/integrations/integrations.types'
import Link from 'next/link'

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
          <Link passHref href="https://vercel.com/integrations/supabase-v2-local">
            <a target="_blank" rel="noreferrer">
              <Button type="default" className="!mt-3">
                Install Vercel Integration
              </Button>
            </a>
          </Link>
        )}
        {integration && !vercelProjectIntegration && <div>Connect project</div>}
        {integration && vercelProjectIntegration && <div>Select project</div>}
      </div>
    </Modal.Content>
  )
}

export default VercelProjectSelection
