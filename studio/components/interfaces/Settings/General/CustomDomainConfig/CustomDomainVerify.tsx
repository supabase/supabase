import { observer } from 'mobx-react-lite'
import Link from 'next/link'
import { useState } from 'react'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  IconAlertCircle,
  IconExternalLink,
  IconHelpCircle,
  IconRefreshCw,
} from 'ui'

import Panel from 'components/ui/Panel'
import { ProjectApiResponse } from 'data/config/project-api-query'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import { useCustomDomainReverifyMutation } from 'data/custom-domains/custom-domains-reverify-mutation'
import DNSRecord from './DNSRecord'

export type CustomDomainVerifyProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
  settings?: ProjectApiResponse
}

const CustomDomainVerify = ({ projectRef, customDomain, settings }: CustomDomainVerifyProps) => {
  const [isNotVerifiedYet, setIsNotVerifiedYet] = useState(false)

  const { mutate: reverifyCustomDomain, isLoading: isReverifyLoading } =
    useCustomDomainReverifyMutation({
      onSuccess: (res) => {
        if (res.status === '2_initiated') setIsNotVerifiedYet(true)
      },
    })
  const { mutate: deleteCustomDomain, isLoading: isDeleting } = useCustomDomainDeleteMutation()

  const hasCAAErrors = customDomain.ssl.validation_errors?.reduce(
    (acc, error) => acc || error.message.includes('caa_error'),
    false
  )

  const onReverifyCustomDomain = () => {
    if (!projectRef) return console.error('Project ref is required')
    reverifyCustomDomain({ projectRef })
  }

  const onCancelCustomDomain = async () => {
    if (!projectRef) return console.error('Project ref is required')
    deleteCustomDomain({ projectRef })
  }

  return (
    <>
      <Panel.Content className="space-y-6">
        <div>
          <h4 className="text-foreground mb-2">
            Configure TXT verification for your custom domain{' '}
            <code className="text-sm">{customDomain.hostname}</code>
          </h4>
          <p className="text-sm text-foreground-light">
            Set the following TXT record(s) in your DNS provider, then click verify to confirm your
            control over the domain
          </p>
          <p className="text-sm text-foreground-light">
            Records which have been successfully verified will be removed from this list below.
          </p>
          <div className="mt-4 mb-2">
            <Alert_Shadcn_ variant="default">
              {isNotVerifiedYet ? (
                <IconAlertCircle className="text-foreground-light" strokeWidth={1.5} />
              ) : (
                <IconHelpCircle className="text-foreground-light" strokeWidth={1.5} />
              )}
              <AlertTitle_Shadcn_>
                {isNotVerifiedYet
                  ? 'Unable to verify records from DNS provider yet.'
                  : 'Please note that it may take up to 24 hours for the DNS records to propagate.'}
              </AlertTitle_Shadcn_>
              <AlertDescription_Shadcn_>
                {isNotVerifiedYet ? (
                  <div className="mt-2">
                    <p>
                      Do check again in a bit as it may take up to 24 hours for changes in DNS
                      records to propagate.
                    </p>
                    <p>
                      You may also visit{' '}
                      <Link
                        href={`https://whatsmydns.net/#TXT/${customDomain.hostname}`}
                        className="text-brand"
                      >
                        here
                      </Link>{' '}
                      to check if your DNS has been propagated successfully before clicking verify.
                    </p>
                    <p>
                      Some registrars will require you to remove the domain name when creating DNS
                      records. As an example, to create a record for `foo.app.example.com`, you
                      would need to create an entry for `foo.app`.
                    </p>
                  </div>
                ) : (
                  <p>
                    You may also visit{' '}
                    <Link
                      href={`https://whatsmydns.net/#TXT/${customDomain.hostname}`}
                      className="text-brand"
                    >
                      here
                    </Link>{' '}
                    to check if your DNS has been propagated successfully before clicking verify.
                  </p>
                )}
              </AlertDescription_Shadcn_>
            </Alert_Shadcn_>
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
            <code className="text-xs">0 issue "digicert.com"</code>
          </Alert>
        )}

        {customDomain.ssl.status === 'validation_timed_out' ? (
          <Alert withIcon variant="warning" title="Validation timed out">
            Please click "Verify" again to retry the validation of the records
          </Alert>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-4">
              <div className="w-[50px]">
                <p className="text-foreground-light text-sm">Type</p>
              </div>
              <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4 input-mono flex-1">
                <div className="flex flex-row space-x-2 justify-between col-span-12">
                  <label className="block text-foreground-light text-sm break-all">Name</label>
                </div>
              </div>
              <div className="text-sm grid gap-2 md:grid md:grid-cols-12 md:gap-x-4 input-mono flex-1">
                <div className="flex flex-row space-x-2 justify-between col-span-12">
                  <label className="block text-foreground-light text-sm break-all">Content</label>
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
                <p className="text-sm text-foreground-light">
                  SSL certificate is being deployed. Please wait a few minutes and try again.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="!mt-4">
          <p className="text-sm text-foreground-light">
            One of the records requires you to{' '}
            <span className="text-foreground-light">replace</span> the CNAME record set up in the
            first step with a TXT record.
          </p>
          <p className="text-sm text-foreground-light">
            You'll be able to restore it back to the CNAME after the verification process has been
            completed.
          </p>
        </div>
      </Panel.Content>

      <div className="border-t border-muted" />

      <Panel.Content>
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
