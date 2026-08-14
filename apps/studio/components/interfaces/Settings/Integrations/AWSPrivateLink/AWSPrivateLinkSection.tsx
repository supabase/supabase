import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
  cn,
} from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { IntegrationSectionIcon } from '../IntegrationsSettings'
import { AWSPrivateLinkAccountItem } from './AWSPrivateLinkAccountItem'
import { AWSPrivateLinkAttentionAdmonition } from './AWSPrivateLinkAttentionAdmonition'
import { AWSPrivateLinkForm } from './AWSPrivateLinkForm'
import { ResourceList } from '@/components/ui/Resource/ResourceList'
import { UpgradeToPro } from '@/components/ui/UpgradeToPro'
import { useAWSAccountDeleteMutation } from '@/data/aws-accounts/aws-account-delete-mutation'
import type { AWSAccount } from '@/data/aws-accounts/aws-accounts-query'
import { useAWSAccountsQuery } from '@/data/aws-accounts/aws-accounts-query'
import { formatDatabaseID } from '@/data/read-replicas/replicas.utils'
import { useCheckEntitlements } from '@/hooks/misc/useCheckEntitlements'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { IS_PLATFORM } from '@/lib/constants'

export const AWSPrivateLinkSection = () => {
  const { data: project } = useSelectedProjectQuery()
  const { data: accounts } = useAWSAccountsQuery({ projectRef: project?.ref })

  const [selectedAccount, setSelectedAccount] = useState<AWSAccount>()
  const [showForm, setShowForm] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const { mutate: deleteAccount, isPending: isDeleting } = useAWSAccountDeleteMutation({
    onSuccess: () => {
      toast.success('Connection will be deleted shortly')
      setShowDeleteModal(false)
      setShowForm(false)
      setSelectedAccount(undefined)
    },
  })

  const { hasAccess: hasPrivateLinkAccess } = useCheckEntitlements('security.private_link')
  const promptPlanUpgrade = IS_PLATFORM && !hasPrivateLinkAccess

  const onAddAccount = () => {
    setSelectedAccount(undefined)
    setShowForm(true)
  }

  const onEditAccount = (account: AWSAccount) => {
    setSelectedAccount(account)
    setShowForm(true)
  }

  const onConfirmDelete = () => {
    if (selectedAccount && project) {
      deleteAccount({
        projectRef: project.ref,
        awsAccountId: selectedAccount.aws_account_id,
        databaseIdentifier:
          selectedAccount.database_type === 'READ_REPLICA'
            ? selectedAccount.database_identifier
            : undefined,
      })
    }
  }

  const deleteDatabaseCopy =
    selectedAccount?.database_type === 'READ_REPLICA'
      ? selectedAccount.database_identifier
        ? `the read replica (ID: ${formatDatabaseID(selectedAccount.database_identifier)})`
        : 'a read replica'
      : 'the primary database'

  return (
    <>
      <PageSection>
        <PageSectionMeta>
          <div className="flex flex-1 items-start gap-5">
            <IntegrationSectionIcon title="aws" />
            <PageSectionSummary>
              <PageSectionTitle>AWS PrivateLink</PageSectionTitle>
              <PageSectionDescription>
                Private connectivity from a connected AWS VPC, without the public internet.
              </PageSectionDescription>
            </PageSectionSummary>
          </div>
        </PageSectionMeta>
        <PageSectionContent>
          <div className="space-y-6">
            {promptPlanUpgrade && (
              <UpgradeToPro
                layout="responsive"
                primaryText="Available on Team and Enterprise plans"
                secondaryText="Upgrade to add a PrivateLink connection."
                buttonText="Upgrade to Team"
                source="aws-privatelink-integration"
              />
            )}
            <div className={cn(promptPlanUpgrade && 'opacity-25 pointer-events-none')}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-foreground">Connections</h3>
                <Button variant="default" icon={<Plus />} onClick={onAddAccount}>
                  Add connection
                </Button>
              </div>
              <AWSPrivateLinkAttentionAdmonition accounts={accounts} className="mb-3" />
              {(accounts?.length ?? 0) > 0 ? (
                <ResourceList>
                  {accounts?.map((account) => (
                    <AWSPrivateLinkAccountItem
                      key={`${account.aws_account_id}-${account.database_identifier ?? 'primary'}`}
                      account={account}
                      onView={() => onEditAccount(account)}
                    />
                  ))}
                </ResourceList>
              ) : (
                <Card>
                  <CardContent>
                    <p className="text-foreground-lighter text-sm">No connections yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </PageSectionContent>
      </PageSection>

      <AWSPrivateLinkForm
        account={selectedAccount}
        open={showForm}
        onOpenChange={setShowForm}
        onDelete={() => setShowDeleteModal(true)}
      />

      <AlertDialog
        open={showDeleteModal}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setShowDeleteModal(false)
        }}
      >
        <AlertDialogContent size="small">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete connection</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the PrivateLink connection for{' '}
              <code className="text-code-inline">{selectedAccount?.aws_account_id}</code> on{' '}
              {deleteDatabaseCopy}. Applications using this private path will lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="danger" loading={isDeleting} onClick={onConfirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
