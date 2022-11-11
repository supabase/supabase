import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Button, IconTrash } from 'ui'

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
      <div className="flex items-center justify-between">
        <div>
          <code className="text-sm bg-green-400">{customDomain.hostname}</code> is activate and
          serving traffic.
        </div>

        <Button
          type="danger"
          icon={<IconTrash />}
          onClick={() => setIsDeleteConfirmModalVisible(true)}
        >
          Delete Custom Domain
        </Button>
      </div>

      <ConfirmModal
        danger
        visible={isDeleteConfirmModalVisible}
        title={`Are you sure you want to delete ${customDomain.hostname}?`}
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
