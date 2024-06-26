import { ThirdPartyAuthIntegration } from 'data/third-party-auth/integrations-query'
import { Check } from 'lucide-react'
import Image from 'next/legacy/image'

import { Badge, Button } from 'ui'
import { AWS_IDP_REGIONS } from './AwsRegionSelector'
import {
  INTEGRATION_TYPES,
  getIntegrationType,
  getIntegrationTypeIcon,
  getIntegrationTypeLabel,
} from './ThirdPartyAuthForm.utils'

interface IntegrationCardProps {
  integration: ThirdPartyAuthIntegration
  canUpdateConfig: boolean
  onSelect: () => void
}

export const getIntegrationTypeDescription = (type: INTEGRATION_TYPES) => {
  switch (type) {
    case 'firebase':
      return 'Allow users to use Supabase with Firebase project'
    case 'auth0':
      return 'Auth0'
    case 'awsCognito':
      return 'AWS Cognito'
    case 'custom':
    default:
      return 'Custom'
  }
}

export const IntegrationTypeContent = ({
  type,
  integration,
}: {
  type: INTEGRATION_TYPES
  integration: ThirdPartyAuthIntegration
}) => {
  switch (type) {
    case 'firebase': {
      const projectName =
        integration.oidc_issuer_url?.replace('https://securetoken.google.com/', '') || ''

      return (
        <div className="text-sm flex flex-row gap-x-4">
          <span className="text-foreground-light w-36">Firebase Project ID</span>
          <span className="text-foreground">{projectName}</span>
        </div>
      )
    }
    case 'auth0':
      const domainName =
        integration.oidc_issuer_url?.replace('https://', '').replace('.auth0.com', '') || ''

      return (
        <div className="text-sm flex flex-row gap-x-4">
          <span className="text-foreground-light w-36">Auth0 Domain Name</span>
          <span className="text-foreground">{domainName}</span>
        </div>
      )
    case 'awsCognito': {
      const region =
        integration.oidc_issuer_url?.split('.').filter((s) => AWS_IDP_REGIONS.includes(s))[0] || ''

      const userPoolId =
        integration.oidc_issuer_url?.split('/').filter((s) => s.startsWith(region || ''))[0] || ''

      return (
        <div className="text-sm flex flex-col gap-y-2">
          <div className="flex flex-row gap-x-4">
            <span className="text-foreground-light w-36">Region</span>
            <span className="text-foreground">{region}</span>
          </div>
          <div className="flex flex-row gap-x-4">
            <span className="text-foreground-light w-36">User Pool ID</span>
            <span className="text-foreground">{userPoolId}</span>
          </div>
        </div>
      )
    }

    case 'custom':
    default:
      return <>Custom</>
  }
}

export const IntegrationCard = ({
  integration,
  canUpdateConfig,
  onSelect,
}: IntegrationCardProps) => {
  let type = getIntegrationType(integration)

  if (type === 'custom') {
    return null
  }

  return (
    <div className="bg-surface-100 border-default overflow-hidden border shadow px-5 py-4 flex flex-row first:rounded-t-md last:rounded-b-md space-x-4">
      <div className="py-1">
        <Image src={getIntegrationTypeIcon(type)} width={21} height={21} alt={`${type} icon`} />
      </div>
      <div className="flex flex-col flex-0 overflow-y-auto w-full gap-y-4">
        <div className="text-sm flex flex-col">
          <span className="text-foreground">{getIntegrationTypeLabel(type)}</span>
          <span className="text-foreground-lighter">{getIntegrationTypeDescription(type)}</span>
        </div>

        <IntegrationTypeContent type={type} integration={integration} />
        <div>
          {/* TODO: this should be a configure integration where it would show the sheet and the user can disable or delete the integration
              but there's no "edit integration" endpoing for now. */}
          <Button type="danger" disabled={!canUpdateConfig} onClick={() => onSelect()}>
            Delete integration
          </Button>
        </div>
      </div>
      <div className="flex-1">
        {true ? (
          <Badge className="space-x-1" size="large" variant="brand">
            <div className="h-3.5 w-3.5 bg-brand rounded-full flex justify-center items-center">
              <Check className="h-2 w-2 text-background-overlay" strokeWidth={6} />
            </div>
            <span>Enabled</span>
          </Badge>
        ) : (
          <Badge variant="warning" size="large">
            <span>Disabled</span>
          </Badge>
        )}
      </div>
    </div>
  )
}
