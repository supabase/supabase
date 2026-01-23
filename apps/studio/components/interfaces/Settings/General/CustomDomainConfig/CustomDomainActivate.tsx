import { useState } from 'react'
import { toast } from 'sonner'

import { DocsButton } from 'components/ui/DocsButton'
import Panel from 'components/ui/Panel'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCheckCNAMERecordMutation } from 'data/custom-domains/check-cname-mutation'
import { useCustomDomainActivateMutation } from 'data/custom-domains/custom-domains-activate-mutation'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import type { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import { DOCS_URL } from 'lib/constants'
import { Button } from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'
import { Admonition } from 'ui-patterns/admonition'

export type CustomDomainActivateProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
}

const CustomDomainActivate = ({ projectRef, customDomain }: CustomDomainActivateProps) => {
  const [isActivateConfirmModalVisible, setIsActivateConfirmModalVisible] = useState(false)

  const { data: settings } = useProjectSettingsV2Query({ projectRef })
  const { mutate: checkCNAMERecord, isPending: isCheckingRecord } = useCheckCNAMERecordMutation()
  const { mutate: activateCustomDomain, isPending: isActivating } = useCustomDomainActivateMutation(
    {
      onSuccess: () => {
        toast.success(`Successfully activated custom domain`)
        setIsActivateConfirmModalVisible(false)
      },
    }
  )
  const { mutate: deleteCustomDomain, isPending: isDeleting } = useCustomDomainDeleteMutation({
    onSuccess: () => {
      toast.success(
        'Custom domain setup cancelled successfully. It may take a few seconds before your custom domain is fully removed, so you may need to refresh your browser.'
      )
    },
  })

  const endpoint = settings?.app_config?.endpoint

  const onActivateCustomDomain = async () => {
    if (!projectRef) return console.error('Project ref is required')
    checkCNAMERecord(
      { domain: customDomain.hostname },
      { onSuccess: () => activateCustomDomain({ projectRef }) }
    )
  }

  const onCancelCustomDomain = async () => {
    if (!projectRef) return console.error('Project ref is required')
    deleteCustomDomain({ projectRef })
  }

  return (
    <>
      <div className="flex flex-col items-start">
        <Panel.Content>
          <div className="flex flex-col gap-2">
            <h4 className="text-foreground">Enable your custom domain</h4>
            <p className="text-sm text-foreground-light">
              Set up is almost complete. Press “Activate” below to enable{' '}
              <code className="text-code-inline">{customDomain.hostname}</code> for this project.
            </p>
            <p className="text-sm text-foreground-light">
              We recommend that you schedule a downtime window of 20 - 30 minutes for your
              application, as you will need to update any services that need to know about your
              custom domain (e.g client side code or OAuth providers).
            </p>
          </div>
          <div className="mt-4">
            <Admonition
              type="note"
              title="Retain your CNAME record for service continuity after activation"
            >
              <p>
                Your custom domain CNAME record for{' '}
                <code className="text-code-inline">{customDomain.hostname}</code> should resolve to{' '}
                {endpoint ? (
                  <code className="text-code-inline">{endpoint}</code>
                ) : (
                  "your project's API URL"
                )}
                . If you're using Cloudflare as your DNS provider, disable the proxy option.
              </p>
            </Admonition>
          </div>
        </Panel.Content>

        <div className="w-full border-t border-muted" />

        <Panel.Content className="w-full">
          <div className="flex items-center justify-between">
            <DocsButton href={`${DOCS_URL}/guides/platform/custom-domains`} />
            <div className="flex items-center space-x-2">
              <Button
                type="default"
                className="self-end"
                onClick={onCancelCustomDomain}
                loading={isDeleting}
              >
                Cancel
              </Button>
              <Button
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

      <ConfirmationModal
        size="small"
        loading={isCheckingRecord || isActivating}
        visible={isActivateConfirmModalVisible}
        title="Activate custom domain"
        confirmLabel="Activate"
        confirmLabelLoading="Activating"
        onCancel={() => setIsActivateConfirmModalVisible(false)}
        onConfirm={onActivateCustomDomain}
      >
        <p className="text-sm">
          Activating <code className="text-code-inline !break-normal">{customDomain.hostname}</code>{' '}
          will make it visible to users in place of your project’s Supabase domain. The Supabase
          domain will continue to work too.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default CustomDomainActivate
