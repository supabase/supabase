import { WarehouseIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

import { AlertError } from '@/components/ui/AlertError'
import { useWarehouseSetupStatusQuery } from '@/data/warehouse/warehouse-setup-status-query'

interface WarehouseMetricsEmptyStateProps {
  projectRef: string | undefined
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

export const WarehouseMetricsEmptyState = ({ projectRef }: WarehouseMetricsEmptyStateProps) => {
  const { data, isPending, isError, error, isFetching, refetch } = useWarehouseSetupStatusQuery({
    projectRef,
  })

  if (isPending)
    return <p className="py-16 text-sm text-foreground-light">Checking Warehouse status...</p>
  if (isError) {
    return (
      <AlertError
        projectRef={projectRef}
        subject="Failed to check Warehouse status"
        error={error}
        additionalActions={
          <Button variant="default" loading={isFetching} onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    )
  }

  const hasLiveTables = data?.tables.some((table) => table.state === 'live') ?? false
  const isNotSetUp = data?.setup_status === 'not_started' && !hasLiveTables
  const isDisabled = data?.setup_status === 'disabled' && !hasLiveTables
  const canSetUp = isNotSetUp || isDisabled
  const copy = isNotSetUp ? COPY.not_provisioned : COPY.unavailable
  const { title, description } = isDisabled ? COPY.disabled : copy

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
