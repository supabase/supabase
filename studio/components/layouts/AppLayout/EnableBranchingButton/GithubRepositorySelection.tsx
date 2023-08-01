import clsx from 'clsx'
import { useParams } from 'common'
import { Integration } from 'data/integrations/integrations.types'
import Link from 'next/link'
import { Modal, Badge, Button, IconGitHub } from 'ui'

interface GithubRepositorySelectionProps {
  integration?: Integration
}

// [Joshen TODO] Integrate the Github repo selector

const GithubRepositorySelection = ({ integration }: GithubRepositorySelectionProps) => {
  const { ref } = useParams()
  const githubProjectIntegration = integration?.connections.find(
    (connection) => connection.supabase_project_ref === ref
  )

  return (
    <div className={clsx('border-t border-b', !integration ? 'border-amber-300 bg-amber-100' : '')}>
      <Modal.Content>
        <div className="space-y-1 py-6">
          <div className="flex items-center space-x-2">
            <p>Git Connection</p>
            <Badge color="amber">Required</Badge>
          </div>
          <p className="text-sm text-light">
            {githubProjectIntegration !== undefined
              ? 'Your database will make preview branches based on your branches in the following repository'
              : 'Your database will make preview branches based on your branches in the Git repository that your project is connected with.'}
          </p>
          {!integration && (
            <Link passHref href="/">
              <a target="_blank" rel="noreferrer">
                <Button type="default" className="!mt-3">
                  Install Github Integration
                </Button>
              </a>
            </Link>
          )}
          {integration && !githubProjectIntegration && (
            <div className="border border-dashed rounded w-full !mt-4 flex items-center justify-center py-4 space-x-4">
              <IconGitHub strokeWidth={2} />
              <Button type="default" onClick={() => {}}>
                Connect repo
              </Button>
            </div>
          )}
        </div>
      </Modal.Content>
    </div>
  )
}

export default GithubRepositorySelection
