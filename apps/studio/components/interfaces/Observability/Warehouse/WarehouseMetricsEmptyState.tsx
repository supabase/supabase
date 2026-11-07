import { DatabaseZapIcon } from 'lucide-react'
import Link from 'next/link'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'

interface WarehouseMetricsEmptyStateProps {
  projectRef: string | undefined
  status: 'not_provisioned' | 'disabled'
}

const COPY = {
  not_provisioned: {
    title: "Supabase Warehouse isn't enabled",
    description: 'Enable Supabase Warehouse to see query, latency, and capacity metrics here.',
  },
  disabled: {
    title: 'Supabase Warehouse is disabled',
    description:
      'Enable Supabase Warehouse again to see query, latency, and capacity metrics here.',
  },
} as const

export const WarehouseMetricsEmptyState = ({
  projectRef,
  status,
}: WarehouseMetricsEmptyStateProps) => {
  const { title, description } = COPY[status]

  return (
    <EmptyStatePresentational
      icon={DatabaseZapIcon}
      title={title}
      description={description}
      className="my-16"
    >
      <Button asChild variant="default">
        <Link href={`/project/${projectRef}/integrations/warehouse/overview`}>
          Go to Warehouse settings
        </Link>
      </Button>
    </EmptyStatePresentational>
  )
}
