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

import { useWarehouseReplicatedTargets } from './useWarehouseReplicatedTargets'
import { warehouseKeys } from '@/data/warehouse/keys'
import { useWarehouseSetupMutation } from '@/data/warehouse/warehouse-setup-mutation'
import { useTrack } from '@/lib/telemetry/track'

export const WarehouseDisableCard = () => {
  const { ref: projectRef } = useParams()
  const queryClient = useQueryClient()
  const track = useTrack()
  const [isConfirming, setIsConfirming] = useState(false)

  const replicatedTargets = useWarehouseReplicatedTargets({ projectRef })

  const setupMutation = useWarehouseSetupMutation({
    onSuccess: async () => {
      // Disabling also turns off catalog access server-side, which the setup mutation doesn't know
      // to invalidate on its own.
      await queryClient.invalidateQueries({ queryKey: warehouseKeys.catalog(projectRef) })
      setIsConfirming(false)
      toast.success('Warehouse disabled')
    },
    onError: (error) => toast.error(`Failed to disable Warehouse: ${error.message}`),
  })

  const handleDisable = () => {
    if (!projectRef) return undefined
    // Snapshotted before the mutation, whose own onSuccess awaits the post-disable refetches.
    const targets = replicatedTargets

    // Returned so the dialog stays open on failure and closes once the disable succeeds.
    return setupMutation.mutateAsync(
      { projectRef, body: { targets: [] } },
      {
        onSuccess: () =>
          track('warehouse_disabled', {
            ...(targets !== undefined && {
              schemaTargetCount: targets.filter((target) => target.type === 'schema').length,
              tableTargetCount: targets.filter((target) => target.type === 'table').length,
            }),
          }),
      }
    )
  }

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
              onClick={handleDisable}
            >
              Disable Warehouse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  )
}
