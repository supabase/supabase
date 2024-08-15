import { ChevronDown } from 'lucide-react'
import Image from 'next/image'

import { IS_PLATFORM } from 'common'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'
import {
  getIntegrationTypeIcon,
  getIntegrationTypeLabel,
  INTEGRATION_TYPES,
} from './ThirdPartyAuthForm.utils'
import Link from 'next/link'

interface AddIntegrationDropdownProps {
  buttonText?: string
  onSelectIntegrationType: (type: INTEGRATION_TYPES) => void
}

const Providers: INTEGRATION_TYPES[] = ['firebase', 'auth0', 'awsCognito']

const ProviderDropdownItem = ({
  disabled,
  type,
  onSelectIntegrationType,
}: {
  disabled?: boolean
  type: INTEGRATION_TYPES
  onSelectIntegrationType: (type: INTEGRATION_TYPES) => void
}) => {
  return (
    <DropdownMenuItem
      key={type}
      onClick={() => onSelectIntegrationType(type)}
      className={cn('flex items-center gap-x-2 p-2', disabled && 'cursor-not-allowed')}
      disabled={disabled}
    >
      <Image src={getIntegrationTypeIcon(type)} width={16} height={16} alt={`${type} icon`} />
      <span>{getIntegrationTypeLabel(type)}</span>
    </DropdownMenuItem>
  )
}

export const AddIntegrationDropdown = ({
  onSelectIntegrationType,
}: AddIntegrationDropdownProps) => {
  const organization = useSelectedOrganization()

  const { data: subscription } = useOrgSubscriptionQuery(
    { orgSlug: organization?.slug },
    { enabled: IS_PLATFORM }
  )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="primary" iconRight={<ChevronDown size={14} strokeWidth={1} />}>
          Add provider
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <ProviderDropdownItem type="firebase" onSelectIntegrationType={onSelectIntegrationType} />

        {subscription?.plan.id === 'free' ? (
          <>
            <DropdownMenuSeparator />
            <div className="bg-surface-200 -m-1 p-2">
              <DropdownMenuLabel className="grid gap-1">
                <p className="text-foreground-light">Unavailable on the Free plan</p>
                <p className="text-foreground-lighter text-xs">
                  <Link
                    target="_href"
                    rel="noreferrer"
                    className="underline hover:text-foreground-light transition"
                    href={`/org/${organization?.slug}/billing`}
                  >
                    Upgrade your plan
                  </Link>{' '}
                  to add the following providers to your project.
                </p>
              </DropdownMenuLabel>
              <ProviderDropdownItem
                disabled
                type="auth0"
                onSelectIntegrationType={onSelectIntegrationType}
              />
              <ProviderDropdownItem
                disabled
                type="awsCognito"
                onSelectIntegrationType={onSelectIntegrationType}
              />
            </div>
          </>
        ) : (
          <>
            <ProviderDropdownItem type="auth0" onSelectIntegrationType={onSelectIntegrationType} />
            <ProviderDropdownItem
              type="awsCognito"
              onSelectIntegrationType={onSelectIntegrationType}
            />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
