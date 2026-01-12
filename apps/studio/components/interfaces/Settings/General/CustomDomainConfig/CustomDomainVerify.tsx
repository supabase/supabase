import { AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { DocsButton } from 'components/ui/DocsButton'
import { InlineLink } from 'components/ui/InlineLink'
import Panel from 'components/ui/Panel'
import { useProjectSettingsV2Query } from 'data/config/project-settings-v2-query'
import { useCustomDomainDeleteMutation } from 'data/custom-domains/custom-domains-delete-mutation'
import { useCustomDomainsQuery } from 'data/custom-domains/custom-domains-query'
import { useCustomDomainReverifyQuery } from 'data/custom-domains/custom-domains-reverify-query'
import { DOCS_URL } from 'lib/constants'
import { useEffect } from 'react'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  WarningIcon,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import DNSRecord from './DNSRecord'
import { DNSTableHeaders } from './DNSTableHeaders'

const CustomDomainVerify = () => {
  const { ref: projectRef } = useParams()

  const { data: settings } = useProjectSettingsV2Query({ projectRef })

  const { data: customDomainData } = useCustomDomainsQuery({ projectRef })
  const customDomain = customDomainData?.customDomain
  const isSSLCertificateDeploying =
    customDomain?.ssl.status !== undefined && customDomain.ssl.txt_name === undefined

  const { mutate: deleteCustomDomain, isPending: isDeleting } = useCustomDomainDeleteMutation({
    onSuccess: () => {
      toast.success(
        'Custom domain setup cancelled successfully. It may take a few seconds before your custom domain is fully removed, so you may need to refresh your browser.'
      )
    },
  })

  const {
    data: reverifyData,
    refetch: refetchReverify,
    isFetching: isReverifyLoading,
    isError: isReverifyError,
    error: reverifyError,
  } = useCustomDomainReverifyQuery(
    { projectRef },
    {
      // Poll every 10 seconds if the SSL certificate is being deployed
      refetchInterval: isSSLCertificateDeploying && !isDeleting ? 10000 : false,
    }
  )

  useEffect(() => {
    if (isReverifyError) {
      toast.error(reverifyError?.message)
    }
  }, [isReverifyError, reverifyError])

  const isNotVerifiedYet = reverifyData?.status === '2_initiated'

  const hasCAAErrors = customDomain?.ssl.validation_errors?.reduce(
    (acc, error) => acc || error.message.includes('caa_error'),
    false
  )
  const isValidating = (customDomain?.ssl.txt_name ?? '') === ''

  const onReverifyCustomDomain = () => {
    if (!projectRef) return console.error('Project ref is required')
    refetchReverify()
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
            <code className="text-code-inline">{customDomain?.hostname}</code>
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
              <Admonition
                type="note"
                title={
                  isNotVerifiedYet
                    ? 'Unable to verify records from DNS provider yet.'
                    : 'Please note that it may take up to 24 hours for the DNS records to propagate.'
                }
              >
                <p>
                  You may also visit{' '}
                  <InlineLink href={`https://whatsmydns.net/#TXT/${customDomain?.ssl.txt_name}`}>
                    here
                  </InlineLink>{' '}
                  to check if your DNS has been propagated successfully before clicking verify.
                </p>
                {isNotVerifiedYet && (
                  <p className="mt-1">
                    Some registrars will require you to remove the domain name when creating DNS
                    records. As an example, to create a record for{' '}
                    <code className="text-code-inline">foo.app.example.com</code>, you would need to
                    create an entry for <code className="text-code-inline">foo.app</code>.
                  </p>
                )}
              </Admonition>
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
              <code className="text-code-inline">{customDomain?.hostname}</code>. For example:{' '}
              <code className="text-code-inline">0 issue "digicert.com"</code>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        )}

        {customDomain?.ssl.status === 'validation_timed_out' ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>Validation timed out</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Please click "Verify" again to retry the validation of the records
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <div className="space-y-2">
            <DNSTableHeaders display={customDomain?.ssl.txt_name ?? ''} />

            {customDomain?.verification_errors?.includes(
              'custom hostname does not CNAME to this zone.'
            ) && (
              <DNSRecord
                type="CNAME"
                name={customDomain?.hostname}
                value={settings?.app_config?.endpoint ?? 'Loading...'}
              />
            )}

            {!isValidating && customDomain?.ssl.status === 'pending_validation' && (
              <DNSRecord
                type="TXT"
                name={customDomain?.ssl.txt_name ?? 'Loading...'}
                value={customDomain?.ssl.txt_value ?? 'Loading...'}
              />
            )}

            {customDomain?.ssl.status === 'pending_deployment' && (
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
          <DocsButton href={`${DOCS_URL}/guides/platform/custom-domains`} />
          <div className="flex items-center space-x-2">
            <Button
              type="default"
              onClick={onCancelCustomDomain}
              loading={isDeleting}
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
