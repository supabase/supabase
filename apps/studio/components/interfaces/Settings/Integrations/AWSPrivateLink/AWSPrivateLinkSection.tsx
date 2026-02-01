import { useState } from 'react'
import { toast } from 'sonner'

import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { UpgradeToPro } from 'components/ui/UpgradeToPro'
import { useAWSAccountDeleteMutation } from 'data/aws-accounts/aws-account-delete-mutation'
import { useAWSAccountsQuery } from 'data/aws-accounts/aws-accounts-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { IS_PLATFORM } from 'lib/constants'
import { Button, Card, CardContent, cn } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { IntegrationImageHandler } from '../IntegrationsSettings'
import { AWSPrivateLinkAccountItem } from './AWSPrivateLinkAccountItem'
import { AWSPrivateLinkForm } from './AWSPrivateLinkForm'

export const AWSPrivateLinkSection = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: accounts } = useAWSAccountsQuery({ projectRef: project?.ref })

  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { mutate: deleteAccount, isPending: isDeleting } = useAWSAccountDeleteMutation({
    onSuccess: () => {
      toast.success('Account will be deleted shortly')
      setShowDeleteModal(false)
      setSelectedAccount(null)
    },
  })

  const { hasAccess: hasPrivateLinkAccess } = useCheckEntitlements('security.private_link')
  const promptPlanUpgrade = IS_PLATFORM && !hasPrivateLinkAccess

  const onAddAccount = () => {
    setSelectedAccount(null)
    setShowForm(true)
  }

  const onEditAccount = (account: any) => {
    setSelectedAccount(account)
    setShowForm(true)
  }

  const onDeleteAccount = (account: any) => {
    setSelectedAccount(account)
    setShowDeleteModal(true)
  }

  const onConfirmDelete = () => {
    if (selectedAccount && project) {
      deleteAccount({ projectRef: project.ref, awsAccountId: selectedAccount.aws_account_id })
    }
  }

  return (
    <>
      <ScaffoldContainer>
        <ScaffoldSection className="py-12">
          <ScaffoldSectionDetail title="AWS PrivateLink">
            <p>Connect to your Supabase project from your AWS VPC using AWS PrivateLink.</p>
            <IntegrationImageHandler title="aws" />
          </ScaffoldSectionDetail>
          <ScaffoldSectionContent>
            <div className="space-y-6">
              <div>
                <h5 className="text-foreground mb-2">
                  How does the AWS PrivateLink integration work?
                </h5>
                <p className="text-foreground-light text-sm mb-6">
                  Connecting to AWS PrivateLink allows you to create a private connection between
                  your AWS VPC and your Supabase project.
                </p>
                {promptPlanUpgrade && (
                  <div className="mb-6">
                    <UpgradeToPro
                      layout="vertical"
                      primaryText="Only available on Team or Enterprise Plan and above"
                      secondaryText="Connect your AWS VPC privately to your Supabase project using AWS PrivateLink."
                      buttonText="Upgrade to Team"
                      source="aws-privatelink-integration"
                    />
                  </div>
                )}
              </div>
              <div className={cn(promptPlanUpgrade && 'opacity-25 pointer-events-none')}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-foreground text-sm">AWS Accounts</h3>
                  <Button type={promptPlanUpgrade ? 'default' : 'primary'} onClick={onAddAccount}>
                    Add Account
                  </Button>
                </div>
                {(accounts?.length ?? 0) > 0 ? (
                  <ResourceList>
                    {accounts?.map((account) => (
                      <AWSPrivateLinkAccountItem
                        key={account.aws_account_id}
                        {...account}
                        onEdit={() => onEditAccount(account)}
                        onDelete={() => onDeleteAccount(account)}
                      />
                    ))}
                  </ResourceList>
                ) : (
                  <Card>
                    <CardContent>
                      <p className="text-foreground-lighter text-sm">No accounts connected</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>

      <AWSPrivateLinkForm account={selectedAccount} open={showForm} onOpenChange={setShowForm} />

      <ConfirmationModal
        variant="destructive"
        visible={showDeleteModal}
        title="Confirm to delete AWS Account"
        confirmLabel="Delete"
        loading={isDeleting}
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={onConfirmDelete}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete the AWS account connection for{' '}
          {selectedAccount?.aws_account_id}?
        </p>
      </ConfirmationModal>
    </>
  )
}
