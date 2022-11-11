import { ProjectSettingsResponse } from 'data/config/project-settings-query'
import { CustomDomainResponse } from 'data/custom-domains/custom-domains-query'
import { useCustomDomainReverifyMutation } from 'data/custom-domains/custom-domains-reverify-mutation'
import { observer } from 'mobx-react-lite'
import { Button, IconAlertCircle, IconRefreshCw } from 'ui'
import DNSRecord from './DNSRecord'

export type CustomDomainVerifyProps = {
  projectRef?: string
  customDomain: CustomDomainResponse
  settings?: ProjectSettingsResponse
}

const CustomDomainVerify = ({ projectRef, customDomain, settings }: CustomDomainVerifyProps) => {
  const { mutate: reverifyCustomDomain, isLoading: isReverifyLoading } =
    useCustomDomainReverifyMutation()

  const onReverifyCustomDomain = () => {
    if (!projectRef) {
      throw new Error('Project ref is required')
    }

    reverifyCustomDomain({ projectRef })
  }

  return (
    <>
      <div>
        <h4 className="text-scale-1200">Set the following record(s) in your DNS provider:</h4>
        <span className="text-sm text-scale-1100">
          Please note that it may take up to 24 hours for the DNS records to propagate.
        </span>
      </div>

      {customDomain.verification_errors?.includes(
        'custom hostname does not CNAME to this zone.'
      ) && (
        <DNSRecord
          type="CNAME"
          name={customDomain.hostname}
          value={settings?.autoApiService.app_config.endpoint ?? 'Loading...'}
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

      {
        <Button
          icon={<IconRefreshCw />}
          onClick={onReverifyCustomDomain}
          loading={isReverifyLoading}
          className="self-end"
        >
          Verify
        </Button>
      }
    </>
  )
}

export default observer(CustomDomainVerify)
