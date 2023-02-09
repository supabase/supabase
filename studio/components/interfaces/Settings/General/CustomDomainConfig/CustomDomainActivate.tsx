import Link from 'next/link'
import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconExternalLink } from 'ui'

import { useStore } from 'hooks'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import { useCustomDomainActivateMutation } from 'data/custom-domains/custom-domains-activate-mutation'
import { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import Panel from 'components/ui/Panel'
import ConfirmModal from 'components/ui/Dialogs/ConfirmDialog'

export type CustomDomainActivateProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
}

const CustomDomainActivate = ({ projectRef, customDomain }: CustomDomainActivateProps) => {
  const { ui } = useStore()

  const [isActivateConfirmModalVisible, setIsActivateConfirmModalVisible] = useState(false)

  const { mutateAsync: activateCustomDomain } = useCustomDomainActivateMutation()
  const { mutateAsync: deleteCustomDomain, isLoading: isDeleting } = useCustomDomainDeleteMutation()

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

  const onCancelCustomDomain = async () => {
    if (!projectRef) {
      throw new Error('Project ref is required')
    }
    try {
      await deleteCustomDomain({ projectRef })
    } catch (error: any) {
      ui.setNotification({ category: 'error', message: error.message })
    }
  }

  return (
    <>
      <div className="flex flex-col items-start">
        <Panel.Content>
          <div className="flex flex-col gap-2">
            <h4 className="text-scale-1200">
              Setup complete! Press activate to enable the custom domain{' '}
              <code className="text-sm">{customDomain.hostname}</code> for this project.
            </h4>
            <span className="text-sm text-scale-1100">
              We recommend that you schedule a downtime window of 20 - 30 minutes for your
              application, as you will need to update any services that need to know about your
              custom domain (e.g client side code or OAuth providers)
            </span>
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
            <div className="flex items-center space-x-2">
              <Button
                type="default"
                onClick={onCancelCustomDomain}
                loading={isDeleting}
                disabled={isDeleting}
                className="self-end"
              >
                Cancel
              </Button>
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
                disabled={isDeleting}
                onClick={() => setIsActivateConfirmModalVisible(true)}
                className="self-end"
              >
                Activate
              </Button>
            </div>
          </div>
        </Panel.Content>
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
