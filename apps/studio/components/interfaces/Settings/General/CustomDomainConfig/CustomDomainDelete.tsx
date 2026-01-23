import { useState } from 'react'
import { toast } from 'sonner'

import { DocsButton } from 'components/ui/DocsButton'
import Panel from 'components/ui/Panel'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import type { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import { DOCS_URL } from 'lib/constants'
import { Trash } from 'lucide-react'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export type CustomDomainDeleteProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
}

const CustomDomainDelete = ({ projectRef, customDomain }: CustomDomainDeleteProps) => {
  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false)
  const { mutate: deleteCustomDomain, isPending: isDeletingCustomDomain } =
    useCustomDomainDeleteMutation({
      onSuccess: () => {
        toast.success(
          `Successfully deleted custom domain. Refresh your browser to see the changes.`
        )
        setIsDeleteConfirmModalVisible(false)
      },
    })

  const onDeleteCustomDomain = async () => {
    if (!projectRef) return console.error('Project ref is required')
    deleteCustomDomain({ projectRef })
  }

  return (
    <>
      <Panel.Content>
        <div className="w-full space-y-2">
          <p className="text-xs text-foreground-light">Active custom domain:</p>
          <div className="flex items-center space-x-2">
            <code className="text-lg mx-0 flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-brand" />
              <span>
                <code className="text-code-inline">{customDomain.hostname}</code>
              </span>
            </code>
          </div>
          <p className="text-sm text-foreground-light">
            Your custom domain is currently active and is serving traffic
          </p>
        </div>
      </Panel.Content>

      <div className="w-full border-t border-muted" />

      <Panel.Content className="w-full">
        <div className="flex items-center justify-between">
          <DocsButton href={`${DOCS_URL}/guides/platform/custom-domains`} />
          <Button
            type="danger"
            icon={<Trash />}
            onClick={() => setIsDeleteConfirmModalVisible(true)}
          >
            Delete custom domain
          </Button>
        </div>
      </Panel.Content>

      <ConfirmationModal
        visible={isDeleteConfirmModalVisible}
        variant="destructive"
        title="Delete custom domain"
        confirmLabel="Delete"
        confirmLabelLoading="Deleting"
        loading={isDeletingCustomDomain}
        onCancel={() => setIsDeleteConfirmModalVisible(false)}
        onConfirm={onDeleteCustomDomain}
      >
        <p className="text-sm">
          Are you sure you want to delete the custom domain{' '}
          <code className="text-code-inline !break-normal">{customDomain.hostname}</code> for your
          project? You will need to re-verify this domain if you want to use it again.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default CustomDomainDelete
