import { useParams } from 'common'
import { toast } from 'sonner'
import { Switch } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertError } from '@/components/ui/AlertError'
import { useUpdateWarehouseCatalogMutation } from '@/data/warehouse/warehouse-catalog-mutation'
import { useWarehouseCatalogQuery } from '@/data/warehouse/warehouse-catalog-query'

export const WarehouseCatalogAccessCard = () => {
  const { ref: projectRef } = useParams()

  const { data: catalog, isPending, isError, error } = useWarehouseCatalogQuery({ projectRef })
  const catalogMutation = useUpdateWarehouseCatalogMutation({
    onSuccess: (_, variables) => {
      toast.success(variables.body.enabled ? 'Catalog access enabled' : 'Catalog access disabled')
    },
  })

  return (
    <div>
      <h3 className="text-sm font-medium text-foreground mb-1">Catalog access</h3>
      <p className="text-sm text-foreground-light max-w-xl mb-3">
        Lets DuckDB clients attach this project&apos;s Warehouse through its DuckLake catalog.
      </p>

      {isPending && <GenericSkeletonLoader />}
      {isError && <AlertError subject="Failed to load DuckLake catalog access" error={error} />}

      {!isPending && !isError && (
        <Switch
          checked={catalog?.enabled ?? false}
          disabled={catalogMutation.isPending || !projectRef}
          onCheckedChange={(enabled) =>
            projectRef && catalogMutation.mutate({ projectRef, body: { enabled } })
          }
        />
      )}
    </div>
  )
}
