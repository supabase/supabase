import { WarehouseIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

interface WarehouseMetricsEmptyStateProps {
  projectRef: string | undefined
  status: keyof typeof COPY
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
  unavailable: {
    title: 'Warehouse metrics are unavailable',
    description:
      'Metrics could not be retrieved for this Warehouse. Check its status or try refreshing the report.',
  },
} as const

export const WarehouseMetricsEmptyState = ({
  projectRef,
  status,
}: WarehouseMetricsEmptyStateProps) => {
  const { title, description } = COPY[status]
  const canSetUp = status !== 'unavailable'

  return (
    <EmptyStatePresentational
      icon={WarehouseIcon}
      title={title}
      description={description}
      className="my-16"
    >
      <Button asChild variant="default">
        <Link href={`/project/${projectRef}/integrations/warehouse/overview`}>
          {canSetUp ? 'Set up Warehouse' : 'View Warehouse'}
        </Link>
      </Button>
    </EmptyStatePresentational>
  )
}
