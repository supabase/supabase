import clsx from 'clsx'
import { useParams } from 'common'
import Link from 'next/link'
import { Badge, Button, Input_Shadcn_, Modal } from 'ui'

import {
  EmptyIntegrationConnection,
  IntegrationConnection,
} from 'components/interfaces/Integrations/IntegrationPanels'
import { useCheckGithubBranchValidity } from 'data/integrations/integrations-github-branch-check'
import { Integration } from 'data/integrations/integrations.types'
import { useSelectedOrganization } from 'hooks'
import { useState } from 'react'
import { useSidePanelsStateSnapshot } from 'state/side-panels'

interface GithubRepositorySelectionProps {
  integration?: Integration
  hasGithubIntegrationInstalled: boolean
  setSelectedBranch: (name?: string) => void
}

const GithubRepositorySelection = ({
  integration,
  hasGithubIntegrationInstalled,
  setSelectedBranch,
}: GithubRepositorySelectionProps) => {
  const { ref } = useParams()
  const org = useSelectedOrganization()

  const [error, setError] = useState()
  const [branchName, setBranchName] = useState('')

  const githubConnection = integration?.connections.find(
    (connection) => connection.supabase_project_ref === ref
  )
  const [repoOwner, repoName] = githubConnection?.metadata.name.split('/') ?? []

  const sidePanels = useSidePanelsStateSnapshot()
  const githubIntegrationAppUrl =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'prod'
      ? `https://github.com/apps/supabase/installations/new?state=${ref}`
      : process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? `https://github.com/apps/supabase-staging/installations/new?state=${ref}`
      : `https://github.com/apps/supabase-local-testing/installations/new?state=${ref}`

  const { mutate: checkGithubBranchValidity } = useCheckGithubBranchValidity({
    onSuccess: (data) => {
      // setSelectedBranch(data)
    },
    onError: (error) => {
      // setError(error)
    },
  })

  function onSelectConnectRepo() {
    if (integration) {
      sidePanels.setGithubConnectionsOpen(true)
      sidePanels.setGithubConnectionsIntegrationId(integration.id)
    }
  }

  const onBlur = async () => {
    console.log('Validate')
    setSelectedBranch(undefined)
    // checkGithubBranchValidity({
    //   organizationIntegrationId: integration?.id,
    //   repoOwner,
    //   repoName,
    //   branchName,
    // })
  }

  return (
    <div
      className={clsx(
        'border-t border-b',
        !hasGithubIntegrationInstalled ? 'border-warning-300 bg-warning-200' : ''
      )}
    >
      <Modal.Content className="px-7">
        <div className="py-6">
          <div className="flex items-center space-x-2">
            <p>Git Connection</p>
            <Badge color="amber">Required</Badge>
          </div>
          <p className="text-sm text-light !mb-4">
            {githubConnection !== undefined
              ? 'Your database preview branches will be based on the branches in the following repository that your project is connected with:'
              : 'Your database preview branches will be based on the branches in the Git repository that your project is connected with.'}
          </p>
          {!hasGithubIntegrationInstalled && (
            <Link passHref href={githubIntegrationAppUrl}>
              <a>
                <Button type="default" className="!mt-3">
                  Install Github Integration
                </Button>
              </a>
            </Link>
          )}
          {hasGithubIntegrationInstalled && !githubConnection && (
            <EmptyIntegrationConnection
              showNode={false}
              onClick={() => onSelectConnectRepo()}
              orgSlug={org?.slug}
            />
          )}
          {integration && githubConnection && (
            <>
              <ul className="mb-3">
                <IntegrationConnection
                  type={'GitHub'}
                  connection={githubConnection}
                  showNode={false}
                  actions={
                    <Button type="default" onClick={() => onSelectConnectRepo()}>
                      Configure connection
                    </Button>
                  }
                  orientation="vertical"
                />
              </ul>

              <div>
                <label className="block text-sm text-light mb-2" htmlFor="branch-selector">
                  Enter your production branch:
                </label>
                <Input_Shadcn_
                  placeholder="e.g main"
                  value={branchName}
                  onBlur={onBlur}
                  onChange={(e) => setBranchName(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </Modal.Content>
    </div>
  )
}

export default GithubRepositorySelection
