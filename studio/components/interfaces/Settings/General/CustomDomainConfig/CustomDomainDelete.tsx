import Link from 'next/link'
import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconExternalLink, IconTrash } from 'ui'

import { useStore } from 'hooks'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import Panel from 'components/ui/Panel'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

export type CustomDomainDeleteProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
}

const CustomDomainDelete = ({ projectRef, customDomain }: CustomDomainDeleteProps) => {
  const { ui } = useStore()

  const [isDeleteConfirmModalVisible, setIsDeleteConfirmModalVisible] = useState(false)

  const { mutateAsync: deleteCustomDomain } = useCustomDomainDeleteMutation()

  const onDeleteCustomDomain = async () => {
    if (!projectRef) {
      throw new Error('Project ref is required')
    }

    try {
      await deleteCustomDomain({ projectRef })

      ui.setNotification({
        category: 'success',
        message: `Successfully deleted custom domain`,
      })

      setIsDeleteConfirmModalVisible(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: error.message,
      })
    }
  }

  return (
    <>
      <Panel.Content>
        <div className="w-full space-y-2">
          <p className="text-xs text-scale-1100">Active custom domain:</p>
          <div className="flex items-center space-x-2">
            <code className="text-lg mx-0 flex items-center space-x-2">
              <div className="h-2 w-2 rounded-full bg-brand-900" />
              <span>{customDomain.hostname}</span>
            </code>
          </div>
          <p className="text-sm text-scale-1100">
            Your custom domain is currently active and is serving traffic
          </p>
        </div>
      </Panel.Content>

      <div className="w-full border-t border-scale-400" />

      <Panel.Content className="w-full">
        <div className="flex items-center justify-between">
          <Link href="https://supabase.com/docs/guides/platform/custom-domains">
            <a target="_blank">
              <Button type="default" icon={<IconExternalLink />}>
                Documentation
              </Button>
            </a>
          </Link>
          <Button
            type="danger"
            icon={<IconTrash />}
            onClick={() => setIsDeleteConfirmModalVisible(true)}
          >
            Delete Custom Domain
          </Button>
        </div>
      </Panel.Content>

      <ConfirmModal
        danger
        visible={isDeleteConfirmModalVisible}
        // @ts-ignore
        title={
          <div>
            Are you sure you want to delete the custom domain{' '}
            <code className="text-sm">{customDomain.hostname}</code> for the project?
          </div>
        }
        description="Your custom domain will be deactivated. You will need to re-verify your domain if you want to use it again."
        buttonLabel="Delete"
        buttonLoadingLabel="Deleting"
        onSelectCancel={() => setIsDeleteConfirmModalVisible(false)}
        onSelectConfirm={onDeleteCustomDomain}
      />
    </>
  )
}

export default observer(CustomDomainDelete)
