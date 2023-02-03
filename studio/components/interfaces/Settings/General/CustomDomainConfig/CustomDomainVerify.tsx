import Link from 'next/link'
import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { Alert, Button, IconAlertCircle, IconExternalLink, IconHelpCircle, IconRefreshCw } from 'ui'

import { useStore } from 'hooks'
import { ProjectSettingsResponse } from 'data/config/project-settings-query'
import { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import { useCustomDomainReverifyMutation } from 'data/custom-domains/custom-domains-reverify-mutation'
import DNSRecord from './DNSRecord'
import Panel from 'components/ui/Panel'
import InformationBox from 'components/ui/InformationBox'

export type CustomDomainVerifyProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
  settings?: ProjectSettingsResponse
}

const CustomDomainVerify = ({ projectRef, customDomain, settings }: CustomDomainVerifyProps) => {
  const { ui } = useStore()
  const [isNotVerifiedYet, setIsNotVerifiedYet] = useState(false)

  const { mutate: reverifyCustomDomain, isLoading: isReverifyLoading } =
    useCustomDomainReverifyMutation({
      onSuccess: (res) => {
        if (res.status === '2_initiated') setIsNotVerifiedYet(true)
      },
    })
  const { mutateAsync: deleteCustomDomain, isLoading: isDeleting } = useCustomDomainDeleteMutation()

  const hasCAAErrors = customDomain.ssl.validation_errors?.reduce(
    (acc, error) => acc || error.message.includes('caa_error'),
    false
  )

  const onReverifyCustomDomain = () => {
    if (!projectRef) {
      throw new Error('Project ref is required')
    }

    reverifyCustomDomain({ projectRef })
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
      <Panel.Content className="space-y-6">
        <div>
          <h4 className="text-scale-1200 mb-2">
            Configure TXT verification for your custom domain{' '}
            <code className="text-sm">{customDomain.hostname}</code>
          </h4>
          <p className="text-sm text-scale-1100">
            Set the following TXT record(s) in your DNS provider, then click verify to confirm your
            control over the domain
          </p>
          <p className="text-sm text-scale-1100">
            Records which have been successfully verified will be removed from this list below.
          </p>
          <div className="mt-4 mb-2">
            <InformationBox
              hideCollapse
              defaultVisibility
              icon={
                isNotVerifiedYet ? (
                  <IconAlertCircle className="text-scale-1100" strokeWidth={1.5} />
                ) : (
                  <IconHelpCircle className="text-scale-1100" strokeWidth={1.5} />
                )
              }
              title={
                isNotVerifiedYet
                  ? 'Unable to verify records from DNS provider yet.'
                  : 'Please note that it may take up to 24 hours for the DNS records to propagate.'
              }
              description={
                isNotVerifiedYet ? (
                  <div className="space-y-1">
                    <p>
                      Do check again in a bit as it may take up to 24 hours for changes in DNS
                      records to propagate.
                    </p>
                    <p>
                      You may also visit{' '}
                      <Link href={`https://whatsmydns.net/#TXT/${customDomain.hostname}`}>
                        <a className="text-brand-900">here</a>
                      </Link>{' '}
                      to check if your DNS has been propagated successfully before clicking verify.
                    </p>
                  </div>
                ) : (
                  <p>
                    You may also visit{' '}
                    <Link href={`https://whatsmydns.net/#TXT/${customDomain.hostname}`}>
                      <a className="text-brand-900">here</a>
                    </Link>{' '}
                    to check if your DNS has been propagated successfully before clicking verify.
                  </p>
                )
              }
            />
          </div>
        </div>

        {hasCAAErrors && (
          <Alert
            withIcon
            variant="warning"
            title="Certificate Authority Authentication (CAA) error"
          >
            Please add a CAA record allowing "digicert.com" to issue certificates for{' '}
            <code className="text-xs">{customDomain.hostname}</code>. For example:{' '}
            <code className="text-xs">0 issue "digitcert.com"</code>
          </Alert>
        )}

        <div className="space-y-2">
          <div className="flex gap-4">
            <div className="w-[50px]">
              <p className="text-scale-1100 text-sm">Type</p>
            </div>
            <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4 input-mono flex-1">
              <div className="flex flex-row space-x-2 justify-between col-span-12">
                <label className="block text-scale-1100 text-sm break-all">Name</label>
              </div>
            </div>
            <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4 input-mono flex-1">
              <div className="flex flex-row space-x-2 justify-between col-span-12">
                <label className="block text-scale-1100 text-sm break-all">Content</label>
              </div>
            </div>
          </div>

          {customDomain.verification_errors?.includes(
            'custom hostname does not CNAME to this zone.'
          ) && (
            <DNSRecord
              type="CNAME"
              name={customDomain.hostname}
              value={settings?.autoApiService.endpoint ?? 'Loading...'}
            />
          )}

          {customDomain.ownership_verification && (
            <DNSRecord
              type={customDomain.ownership_verification.type}
              name={customDomain.ownership_verification.name}
              value={customDomain.ownership_verification.value}
            />
          )}

          {customDomain.ssl.status === 'pending_validation' && (
            <DNSRecord
              type="TXT"
              name={customDomain.ssl.txt_name ?? 'Loading...'}
              value={customDomain.ssl.txt_value ?? 'Loading...'}
            />
          )}

          {customDomain.ssl.status === 'pending_deployment' && (
            <div className="flex items-center justify-center space-x-2 py-8">
              <IconAlertCircle size={16} strokeWidth={1.5} />
              <p className="text-sm text-scale-1100">
                SSL certificate is being deployed. Please wait a few minutes and try again.
              </p>
            </div>
          )}
        </div>
        <div className="!mt-4">
          <p className="text-sm text-scale-1000">
            One of the records requires you to replace the CNAME record set up in the first step
            with a TXT record.
          </p>
          <p className="text-sm text-scale-1000">
            You'll be able to restore it back to the CNAME after the verification process has been
            completed.
          </p>
        </div>
      </Panel.Content>

      <div className="border-t border-scale-400" />

      <Panel.Content>
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
              disabled={isDeleting || isReverifyLoading}
              className="self-end"
            >
              Cancel
            </Button>
            <Button
              icon={<IconRefreshCw />}
              onClick={onReverifyCustomDomain}
              loading={isReverifyLoading}
              disabled={isDeleting || isReverifyLoading}
              className="self-end"
            >
              Verify
            </Button>
          </div>
        </div>
      </Panel.Content>
    </>
  )
}

export default observer(CustomDomainVerify)
