import { CloudProvider, PROVIDERS } from 'lib/constants'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { Badge, Listbox } from 'ui'

import { useDefaultRegionQuery } from 'data/misc/get-default-region-query'
import { getAvailableRegions } from './ProjectCreation.utils'
import { OrgSubscription } from 'data/subscriptions/types'
import { components } from 'data/api'
import Link from 'next/link'

interface InstanceSizeSelectorProps {
  selectedInstanceSize: string
  subscription: OrgSubscription
  onSelectInstanceSize: (value: string) => void
}

const labels: Record<components['schemas']['DbInstanceSize'], string> = {
  nano: '2-core ARM (shared) / 0.5GB RAM',
  micro: '2-core ARM (shared)  / 1GB RAM',
  small: '2-core ARM (shared) / 2GB RAM',
  medium: '2-core ARM (shared) / 4GB RAM',
  large: '2-core ARM (dedicated) / 8GB RAM',
  xlarge: '4-core ARM (dedicated / 16GB RAM',
  '2xlarge': '8-core ARM (dedicated / 32GB RAM',
  '4xlarge': '16-core ARM (dedicated / 64GB RAM',
  '8xlarge': '32-core ARM (dedicated / 182GB RAM',
  '12xlarge': '48-core ARM (dedicated / 192GB RAM',
  '16xlarge': '64-core ARM (dedicated) / 256GB RAM',
}

export const InstanceSizeSelector = ({
  orgSubscription,
  selectedInstanceSize,
  onSelectInstanceSize,
}: InstanceSizeSelectorProps) => {
  const router = useRouter()
  const availableSizes: components['schemas']['DbInstanceSize'][] = ['nano', 'micro']

  return (
    <Listbox
      layout="horizontal"
      label="Compute Instance"
      type="select"
      value={selectedInstanceSize}
      onChange={(value) => onSelectInstanceSize(value)}
      descriptionText={
        <span>
          Select the the instance size for more power.{' '}
          <Link
            href="https://supabase.com/docs/guides/platform/compute-add-ons"
            className="text-brand opacity-50 underline hover:opacity-100 transition cursor-pointer"
            target="_blank"
          >
            Compute Details
          </Link>
        </span>
      }
    >
      <Listbox.Option disabled key="empty" label="---" value="">
        <span className="text-foreground">Select a compute instance for your project</span>
      </Listbox.Option>
      {availableSizes.map((option, i) => {
        const name = option.toString()
        const label = labels[option]
        return (
          <Listbox.Option
            key={option}
            label={label}
            value={name}
            addOnBefore={() => (
              <Badge className="capitalize" size="small">
                {name}
              </Badge>
            )}
          >
            <span className="text-foreground">16 CPU-cores / 64GB RAM</span>
          </Listbox.Option>
        )
      })}
    </Listbox>
  )
}
