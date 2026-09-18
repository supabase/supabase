import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Card,
  CardContent,
} from 'ui'
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
    <PageSection className="pt-5!">
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
              description="Stops replication and removes Warehouse-managed resources."
            >
              <Button variant="danger" onClick={() => setIsConfirming(true)}>
                Disable Warehouse
              </Button>
            </FormLayout>
          </CardContent>
        </Card>
      </PageSectionContent>

      <AlertDialog open={isConfirming} onOpenChange={setIsConfirming}>
        <AlertDialogContent size="small">
          <AlertDialogHeader>
            <AlertDialogTitle>Disable Warehouse</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogBody>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Disabling Warehouse stops replication and connections to its endpoint. Its
                  pipeline, publication, catalog access, and foreign tables are removed.
                </p>
                <p>Copied data remains in DuckLake storage until deleted.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              loading={setupMutation.isPending}
              disabled={!projectRef}
              onClick={() =>
                projectRef
                  ? setupMutation.mutateAsync({ projectRef, body: { targets: [] } })
                  : undefined
              }
            >
              Disable Warehouse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  )
}
