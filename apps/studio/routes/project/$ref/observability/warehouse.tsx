import { createFileRoute } from '@tanstack/react-router'

import WarehouseReport from '@/pages/project/[ref]/observability/warehouse'

export const Route = createFileRoute('/project/$ref/observability/warehouse')({
  component: ObservabilityWarehouseRoute,
  staticData: {
    observabilityLayoutTitle: 'Warehouse',
  },
})

function ObservabilityWarehouseRoute() {
  return <WarehouseReport dehydratedState={undefined} />
}
