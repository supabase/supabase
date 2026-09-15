import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, CardContent } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

import { warehouseKeys } from '@/data/warehouse/keys'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useTrack } from '@/lib/telemetry/track'

export const WarehouseDisableCard = () => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const track = useTrack()
  const [isConfirming, setIsConfirming] = useState(false)

  const setupMutation = useWarehouseSetupMutation({
    onSuccess: async () => {
      track('warehouse_disabled', {})
      // Disabling also turns off catalog access server-side, which the setup mutation doesn't know
      // to invalidate on its own.
      await queryClient.invalidateQueries({ queryKey: warehouseKeys.catalog(projectRef) })
      setIsConfirming(false)
      toast.success('Warehouse disabled')
    },
    onError: (error) => toast.error(`Failed to disable Warehouse: ${error.message}`),
  })

  return (
    <PageSection>
      <PageSectionMeta>
        <PageSectionSummary>
          <PageSectionTitle>Disable</PageSectionTitle>
        </PageSectionSummary>
      </PageSectionMeta>
      <PageSectionContent>
        <Card>
          <CardContent>
            <FormLayout
              layout="flex-row-reverse"
              label="Disable Warehouse for this project"
              description={
                <>
                  <span className="block">
                    Stops replication and removes the Warehouse pipeline, publication, catalog
                    access, and foreign tables.
                  </span>
                  <span className="mt-1 block">
                    Copied data stays in DuckLake storage until you delete it.
                  </span>
                </>
              }
            >
              <Button variant="danger" onClick={() => setIsConfirming(true)}>
                Disable Warehouse
              </Button>
            </FormLayout>
          </CardContent>
        </Card>
      </PageSectionContent>

      <ConfirmationModal
        variant="destructive"
        visible={isConfirming}
        loading={setupMutation.isPending}
        title="Disable Warehouse"
        confirmLabel="Disable Warehouse"
        description="Replication stops and connections to the Warehouse endpoint stop working."
        onCancel={() => setIsConfirming(false)}
        onConfirm={() => projectRef && setupMutation.mutate({ projectRef, body: { targets: [] } })}
      >
        <div className="space-y-2 text-sm text-foreground-light">
          <p>
            The Warehouse pipeline, publication, catalog access, and foreign tables are removed.
          </p>
          <p>
            Copied data stays in storage until you delete it. Re-enabling the same tables replaces
            their copied data.
          </p>
        </div>
      </ConfirmationModal>
    </PageSection>
  )
}
