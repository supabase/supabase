import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'
import { useCustomDomainActivateMutation } from 'data/custom-domains/custom-domains-activate-mutation'
import { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import { useStore } from 'hooks'
import { observer } from 'mobx-react-lite'
import { useState } from 'react'
import { Button } from 'ui'

export type CustomDomainActivateProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
}

const CustomDomainActivate = ({ projectRef, customDomain }: CustomDomainActivateProps) => {
  const { ui } = useStore()

  const [isActivateConfirmModalVisible, setIsActivateConfirmModalVisible] = useState(false)

  const { mutateAsync: activateCustomDomain } = useCustomDomainActivateMutation()

  const onActivateCustomDomain = async () => {
    if (!projectRef) {
      throw new Error('Project ref is required')
    }

    try {
      await activateCustomDomain({ projectRef })

      ui.setNotification({
        category: 'success',
        message: `Successfully activated custom domain`,
      })

      setIsActivateConfirmModalVisible(false)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: error.message,
      })
    }
  }

  return (
    <>
      <div className="flex flex-col items-start gap-6">
        <div className="flex flex-col gap-2">
          <h4 className="text-scale-1200">
            Setup complete! Press activate to enable the custom domain{' '}
            <code className="text-sm">{customDomain.hostname}</code> for this project.
          </h4>
          <span className="text-sm text-scale-1100">
            We recommend that you schedule a downtime window of 20 - 30 minutes for your
            application, as you will need to update any services that need to know about your custom
            domain (e.g client side code or OAuth providers)
          </span>
        </div>

        <Button
          icon={
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1}
              stroke="currentColor"
              className="w-4 h-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
              />
            </svg>
          }
          onClick={() => setIsActivateConfirmModalVisible(true)}
          className="self-end"
        >
          Activate
        </Button>
      </div>

      <ConfirmModal
        size="small"
        visible={isActivateConfirmModalVisible}
        // @ts-ignore
        title={
          <div>
            Are you sure you want to activate the custom domain{' '}
            <code className="text-sm">{customDomain.hostname}</code> for the project?
          </div>
        }
        description="The existing Supabase subdomain will be deactivated."
        buttonLabel="Activate"
        buttonLoadingLabel="Activating"
        onSelectCancel={() => setIsActivateConfirmModalVisible(false)}
        onSelectConfirm={onActivateCustomDomain}
      />
    </>
  )
}

export default observer(CustomDomainActivate)
