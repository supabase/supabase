import { ChevronDown } from 'lucide-react'
import Image from 'next/image'

import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
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

interface AddIntegrationDropdownProps {
  buttonText?: string
  onSelectIntegrationType: (type: INTEGRATION_TYPES) => void
}

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
  const selectedProject = useSelectedProject()

  const isClerkTPAEnabledFlag = useFlag<string>('isClerkTPAEnabledOnProjects')
  const isClerkTPAEnabled =
    selectedProject?.ref &&
    isClerkTPAEnabledFlag &&
    isClerkTPAEnabledFlag
      .split(',')
      .map((it) => it.trim())
      .includes(selectedProject.ref)

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="primary" iconRight={<ChevronDown size={14} strokeWidth={1} />}>
          Add provider
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Provider</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <ProviderDropdownItem type="firebase" onSelectIntegrationType={onSelectIntegrationType} />

        {isClerkTPAEnabled && (
          <ProviderDropdownItem type="clerk" onSelectIntegrationType={onSelectIntegrationType} />
        )}
        <ProviderDropdownItem type="auth0" onSelectIntegrationType={onSelectIntegrationType} />
        <ProviderDropdownItem type="awsCognito" onSelectIntegrationType={onSelectIntegrationType} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
