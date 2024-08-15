import Link from 'next/link'
import { useState } from 'react'
import toast from 'react-hot-toast'

import Panel from 'components/ui/Panel'
import { useProjectApiQuery } from 'data/config/project-api-query'
import { useCheckCNAMERecordMutation } from 'data/custom-domains/check-cname-mutation'
import { useCustomDomainActivateMutation } from 'data/custom-domains/custom-domains-activate-mutation'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import type { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconExternalLink,
  Modal,
} from 'ui'
import ConfirmationModal from 'ui-patterns/Dialogs/ConfirmationModal'

export type CustomDomainActivateProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
}

const CustomDomainActivate = ({ projectRef, customDomain }: CustomDomainActivateProps) => {
  const [isActivateConfirmModalVisible, setIsActivateConfirmModalVisible] = useState(false)

  const { data: settings } = useProjectApiQuery({ projectRef })
  const { mutate: checkCNAMERecord, isLoading: isCheckingRecord } = useCheckCNAMERecordMutation()
  const { mutate: activateCustomDomain, isLoading: isActivating } = useCustomDomainActivateMutation(
    {
      onSuccess: () => {
        toast.success(`Successfully activated custom domain`)
        setIsActivateConfirmModalVisible(false)
      },
    }
  )
  const { mutate: deleteCustomDomain, isLoading: isDeleting } = useCustomDomainDeleteMutation()

  const endpoint = settings?.autoApiService.endpoint

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
            <h4 className="text-foreground">
              Setup complete! Press activate to enable the custom domain{' '}
              <code className="text-sm">{customDomain.hostname}</code> for this project.
            </h4>
            <span className="text-sm text-foreground-light">
              We recommend that you schedule a downtime window of 20 - 30 minutes for your
              application, as you will need to update any services that need to know about your
              custom domain (e.g client side code or OAuth providers)
            </span>
          </div>
          <div className="mt-4">
            <Alert_Shadcn_>
              <IconAlertCircle className="text-foreground-light" strokeWidth={1.5} />
              <AlertTitle_Shadcn_>
                Remember to restore the original CNAME record from the first step before activating
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                <p className="col-span-12 text-sm lg:col-span-7 leading-6">
                  Set up a CNAME record for <code className="text-xs">{customDomain.hostname}</code>
                  , resolving to{' '}
                  {endpoint ? (
                    <code className="text-xs">{endpoint}</code>
                  ) : (
                    "your project's API URL"
                  )}
                  , with as low a TTL as possible. If you're using Cloudflare as your DNS provider,
                  disable the proxy option.
                </p>
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
          </div>
        </Panel.Content>

        <div className="w-full border-t border-muted" />

        <Panel.Content className="w-full">
          <div className="flex items-center justify-between">
            <Button asChild type="default" icon={<IconExternalLink />}>
              <Link
                href="https://supabase.com/docs/guides/platform/custom-domains"
                target="_blank"
                rel="noreferrer"
              >
                Documentation
              </Link>
            </Button>
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

      <ConfirmationModal
        size="small"
        loading={isCheckingRecord || isActivating}
        visible={isActivateConfirmModalVisible}
        title={
          <>
            Are you sure you want to activate the custom domain{' '}
            <code className="text-sm">{customDomain.hostname}</code> for the project?
          </>
        }
        confirmLabel="Activate"
        confirmLabelLoading="Activating"
        onCancel={() => setIsActivateConfirmModalVisible(false)}
        onConfirm={onActivateCustomDomain}
      >
        <p className="text-sm">
          This will activate the custom domain <code>{customDomain.hostname}</code>. Your project's
          Supabase domain will also remain active.
        </p>
      </ConfirmationModal>
    </>
  )
}

export default CustomDomainActivate
