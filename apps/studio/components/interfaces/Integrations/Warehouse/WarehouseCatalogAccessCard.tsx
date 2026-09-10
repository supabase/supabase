import { useParams } from 'common'
import { toast } from 'sonner'
import { Card, CardContent, Switch } from 'ui'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
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
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Catalog access</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            {isPending && <GenericSkeletonLoader />}
            {isError && (
              <AlertError subject="Failed to load DuckLake catalog access" error={error} />
            )}
            {!isPending && !isError && (
              <FormLayout
                layout="flex-row-reverse"
                label="Allow DuckDB clients to attach Warehouse"
                description="Exposes the DuckLake catalog and its credentials so external tools can attach this project's Warehouse."
              >
                <Switch
                  checked={catalog?.enabled ?? false}
                  disabled={catalogMutation.isPending || !projectRef}
                  onCheckedChange={(enabled) =>
                    projectRef && catalogMutation.mutate({ projectRef, body: { enabled } })
                  }
                />
              </FormLayout>
            )}
          </CardContent>
        </Card>
      </PageSectionContent>
    </PageSection>
  )
}
