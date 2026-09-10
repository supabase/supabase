import { useParams } from 'common'
import { toast } from 'sonner'

import { ConstrainedIntegrationTabScaffold } from '../ConstrainedIntegrationTabScaffold'
import type { WarehouseSetupTarget } from './Warehouse.utils'
import { WarehouseCatalogAccessCard } from './WarehouseCatalogAccessCard'
import { WarehouseDisableCard } from './WarehouseDisableCard'
import { WarehouseDisabledState } from './WarehouseDisabledState'
import { WarehouseSchemaTablePicker } from './WarehouseSchemaTablePicker'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useIsWarehouseProvisioned } from '@/hooks/misc/useIsWarehouseProvisioned'

export const WarehouseSettingsTab = () => {
  const { ref: projectRef } = useParams()
  const { isProvisioned, isPending } = useIsWarehouseProvisioned({ projectRef })

  const setupMutation = useWarehouseSetupMutation({
    onSuccess: () => toast.success('Replicated tables updated'),
  })

  if (!isPending && !isProvisioned) {
    return (
      <ConstrainedIntegrationTabScaffold className="p-0!">
        <WarehouseDisabledState description="edit replicated tables" />
      </ConstrainedIntegrationTabScaffold>
    )
  }

  const handleSubmit = (targets: WarehouseSetupTarget[]) => {
    if (!projectRef) return
    setupMutation.mutate({ projectRef, body: { targets } })
  }

  return (
    <ConstrainedIntegrationTabScaffold>
      <div className="space-y-8">
        <WarehouseSchemaTablePicker
          isEditing
          isSubmitting={setupMutation.isPending}
          onSubmit={handleSubmit}
        />
        <div className="h-px bg-border" />
        <WarehouseCatalogAccessCard />
        <div className="h-px bg-border" />
        <WarehouseDisableCard />
      </div>
    </ConstrainedIntegrationTabScaffold>
  )
}
