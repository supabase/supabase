import { ChevronDown } from 'lucide-react'
import Image from 'next/image'

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import {
  INTEGRATION_TYPES,
  getIntegrationTypeIcon,
  getIntegrationTypeLabel,
} from './ThirdPartyAuthForm.utils'

interface AddIntegrationDropdownProps {
  buttonText?: string
  onSelectIntegrationType: (type: INTEGRATION_TYPES) => void
}

const Providers: INTEGRATION_TYPES[] = ['firebase', 'auth0', 'awsCognito']

export const AddIntegrationDropdown = ({
  onSelectIntegrationType,
}: AddIntegrationDropdownProps) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button type="primary" iconRight={<ChevronDown size={14} strokeWidth={1} />}>
          Add provider
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {Providers.map((type) => {
          const name = getIntegrationTypeLabel(type)
          return (
            <DropdownMenuItem
              key={name}
              onClick={() => onSelectIntegrationType(type)}
              className="flex items-center gap-x-2 p-2"
            >
              <Image
                src={getIntegrationTypeIcon(type)}
                width={16}
                height={16}
                alt={`${name} icon`}
              />
              <span>{name}</span>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
