import { AlertCircle, ExternalLink, HelpCircle, RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import Panel from 'components/ui/Panel'
import type { ProjectApiResponse } from 'data/config/project-api-query'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import type { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import { useCustomDomainReverifyMutation } from 'data/custom-domains/custom-domains-reverify-mutation'
import { useInterval } from 'hooks/misc/useInterval'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'
import DNSRecord from './DNSRecord'
import { DNSTableHeaders } from './DNSTableHeaders'

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
  const isValidating = (customDomain.ssl.txt_name ?? '') === ''

  const onReverifyCustomDomain = () => {
    if (!projectRef) return console.error('Project ref is required')
    reverifyCustomDomain({ projectRef })
  }

  useInterval(
    onReverifyCustomDomain,
    // Poll every 5 seconds if the SSL certificate is being deployed
    customDomain.ssl.status !== undefined && customDomain.ssl.txt_name === undefined ? 5000 : false
  )

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
            control over the domain.
          </p>
          <p className="text-sm text-foreground-light">
            Records which have been successfully verified will be removed from this list below.
          </p>
          {!isValidating && (
            <div className="mt-4 mb-2">
              <Alert_Shadcn_ variant="default">
                {isNotVerifiedYet ? (
                  <AlertCircle className="text-foreground-light" strokeWidth={1.5} />
                ) : (
                  <HelpCircle className="text-foreground-light" strokeWidth={1.5} />
                )}
                <AlertTitle_Shadcn_>
                  {isNotVerifiedYet
                    ? 'Unable to verify records from DNS provider yet.'
                    : 'Please note that it may take up to 24 hours for the DNS records to propagate.'}
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  <div>
                    {isNotVerifiedYet && (
                      <p>
                        Please check again soon. Note that it may take up to 24 hours for changes in
                        DNS records to propagate.
                      </p>
                    )}
                    <p>
                      You may also visit{' '}
                      <Link
                        target="_blank"
                        rel="noreferrer"
                        href={`https://whatsmydns.net/#TXT/${customDomain.hostname}`}
                        className="text-brand"
                      >
                        here
                      </Link>{' '}
                      to check if your DNS has been propagated successfully before clicking verify.
                    </p>
                    {isNotVerifiedYet && (
                      <p className="mt-1 text-foreground-lighter">
                        Some registrars will require you to remove the domain name when creating DNS
                        records. As an example, to create a record for `foo.app.example.com`, you
                        would need to create an entry for `foo.app`.
                      </p>
                    )}
                  </div>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            </div>
          )}
        </div>

        {hasCAAErrors && (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Certificate Authority Authentication (CAA) error
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Please add a CAA record allowing "digicert.com" to issue certificates for{' '}
              <code className="text-xs">{customDomain.hostname}</code>. For example:{' '}
              <code className="text-xs">0 issue "digicert.com"</code>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}

        {customDomain.ssl.status === 'validation_timed_out' ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>Validation timed out</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Please click "Verify" again to retry the validation of the records
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <div className="space-y-2">
            <DNSTableHeaders display={customDomain.ssl.txt_name ?? ''} />

            {customDomain.verification_errors?.includes(
              'custom hostname does not CNAME to this zone.'
            ) && (
              <DNSRecord
                type="CNAME"
                name={customDomain.hostname}
                value={settings?.autoApiService.endpoint ?? 'Loading...'}
              />
            )}

            {!isValidating && customDomain.ssl.status === 'pending_validation' && (
              <DNSRecord
                type="TXT"
                name={customDomain.ssl.txt_name ?? 'Loading...'}
                value={customDomain.ssl.txt_value ?? 'Loading...'}
              />
            )}

            {customDomain.ssl.status === 'pending_deployment' && (
              <div className="flex items-center justify-center space-x-2 py-8">
                <AlertCircle size={16} strokeWidth={1.5} />
                <p className="text-sm text-foreground-light">
                  SSL certificate is being deployed. Please wait a few minutes and try again.
                </p>
              </div>
            )}
          </div>
        )}
      </Panel.Content>

      <div className="border-t border-muted" />

      <Panel.Content>
        <div className="flex items-center justify-between">
          <Button asChild type="default" icon={<ExternalLink />}>
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
              disabled={isDeleting || isReverifyLoading || isValidating}
              className="self-end"
            >
              Cancel
            </Button>
            <Button
              icon={<RefreshCw />}
              onClick={onReverifyCustomDomain}
              loading={!isValidating && isReverifyLoading}
              disabled={isDeleting || isReverifyLoading || isValidating}
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

export default CustomDomainVerify
