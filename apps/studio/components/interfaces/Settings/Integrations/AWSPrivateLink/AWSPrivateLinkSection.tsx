import { useState } from 'react'
import {
  ScaffoldContainer,
  ScaffoldSection,
  ScaffoldSectionContent,
  ScaffoldSectionDetail,
} from 'components/layouts/Scaffold'
import { Button, Card, CardContent } from 'ui'
import AWSPrivateLinkAccountItem from './AWSPrivateLinkAccountItem'
import AWSPrivateLinkForm from './AWSPrivateLinkForm'
import { ResourceList } from 'components/ui/Resource/ResourceList'
import { IntegrationImageHandler } from '../IntegrationsSettings'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

const AWSPrivateLinkSection = () => {
  const [selectedAccount, setSelectedAccount] = useState<any>(null)
  const [showForm, setShowForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const mockAccounts = [
    { id: '1', awsAccountId: '123456789012', region: 'us-east-1', status: 'ACTIVE' },
    { id: '2', awsAccountId: '210987654321', region: 'eu-west-1', status: 'INACTIVE' },
  ]

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
    if (selectedAccount) {
      console.log('Deleting account:', selectedAccount)
      // Call API to delete account here
    }
    setShowDeleteModal(false)
    setSelectedAccount(null)
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
              </div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-foreground text-sm">AWS Accounts</h3>
                <Button onClick={onAddAccount}>Add Account</Button>
              </div>
              {mockAccounts.length > 0 ? (
                <ResourceList>
                  {mockAccounts.map((account) => (
                    <AWSPrivateLinkAccountItem
                      key={account.id}
                      {...account}
                      onClick={() => onEditAccount(account)}
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
          </ScaffoldSectionContent>
        </ScaffoldSection>
      </ScaffoldContainer>
      <AWSPrivateLinkForm
        awsAccountId={selectedAccount?.awsAccountId}
        region={selectedAccount?.region}
        status={selectedAccount?.status}
        open={showForm}
        onOpenChange={setShowForm}
      />
      <ConfirmationModal
        variant="destructive"
        visible={showDeleteModal}
        title="Confirm to delete AWS Account"
        confirmLabel="Delete"
        onCancel={() => setShowDeleteModal(false)}
        onConfirm={onConfirmDelete}
      >
        <p className="text-sm text-foreground-light">
          Are you sure you want to delete the AWS account connection for{' '}
          {selectedAccount?.awsAccountId}?
        </p>
      </ConfirmationModal>
    </>
  )
}

export default AWSPrivateLinkSection
