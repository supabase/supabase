import { WarehouseIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

interface WarehouseMetricsEmptyStateProps {
  projectRef: string | undefined
  status: 'not_provisioned' | 'disabled'
}

const COPY = {
  not_provisioned: {
    title: 'Warehouse is not set up',
    description:
      'Run analytical queries on a replicated copy of your data, then monitor query latency, failures, and capacity here.',
  },
  disabled: {
    title: 'Warehouse is disabled',
    description:
      'Set up Warehouse again to query a replicated copy of your data and monitor its latency, failures, and capacity here.',
  },
} as const

export const WarehouseMetricsEmptyState = ({
  projectRef,
  status,
}: WarehouseMetricsEmptyStateProps) => {
  const { title, description } = COPY[status]

  return (
    <EmptyStatePresentational
      icon={WarehouseIcon}
      title={title}
      description={description}
      className="my-16"
    >
      <Button asChild variant="default">
        <Link href={`/project/${projectRef}/integrations/warehouse/overview`}>
          Set up Warehouse
        </Link>
      </Button>
    </EmptyStatePresentational>
  )
}
