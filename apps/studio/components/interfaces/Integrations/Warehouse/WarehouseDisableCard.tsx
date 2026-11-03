import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
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
  Checkbox,
  Form,
  FormControl,
  FormField,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { FormLayout } from 'ui-patterns/form/Layout/FormLayout'
import {
  PageSection,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'
import { z } from 'zod'

import { useWarehouseReplicatedTargets } from './useWarehouseReplicatedTargets'
import { type WarehouseSetupTarget } from './Warehouse.utils'
import { AlertError } from '@/components/ui/AlertError'
import { useWarehouseDisableMutation } from '@/data/warehouse/warehouse-disable-mutation'
import { useTrack } from '@/lib/telemetry/track'

const FormSchema = z.object({ shouldDeleteData: z.boolean() })
type FormValues = z.infer<typeof FormSchema>
const defaultValues: FormValues = { shouldDeleteData: false }

export const WarehouseDisableCard = () => {
  const { ref: projectRef } = useParams()
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues })
  const track = useTrack()
  const [isConfirming, setIsConfirming] = useState(false)

  const replicatedTargets = useWarehouseReplicatedTargets({ projectRef })
  // Snapshotted when the user confirms: the mutation's own onSuccess awaits the post-disable
  // refetches, after which nothing reads as replicated.
  const targetsAtConfirm = useRef<WarehouseSetupTarget[] | undefined>(undefined)

  const disableMutation = useWarehouseDisableMutation({
    onSuccess: async () => {
      // Tracked from the mutation's onSuccess, not mutateAsync's: the status refetch swaps this
      // card out of the panel, and mutate-level callbacks are skipped once it has unmounted.
      const targets = targetsAtConfirm.current
      track('warehouse_disabled', {
        ...(targets !== undefined && {
          schemaTargetCount: targets.filter((target) => target.type === 'schema').length,
          tableTargetCount: targets.filter((target) => target.type === 'table').length,
        }),
      })
      setIsConfirming(false)
      toast.success('Warehouse disable requested')
    },
    onError: () => {},
  })

  const handleDisable = ({ shouldDeleteData }: FormValues) => {
    if (!projectRef) return undefined
    targetsAtConfirm.current = replicatedTargets
    // Returned so the dialog stays open on failure and closes once the disable succeeds.
    return disableMutation.mutateAsync({ projectRef, shouldDeleteData })
  }

  const disableError = disableMutation.error
  const isLegacyStorageError =
    disableError?.message === 'Legacy Warehouse data must be retained when disabling Warehouse.'

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
              <Button
                variant="danger"
                onClick={() => {
                  form.reset()
                  disableMutation.reset()
                  setIsConfirming(true)
                }}
              >
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
                  Stops replication and disconnects the Warehouse endpoint. Removes its pipeline,
                  publication, catalog access, and foreign tables.
                </p>
              </div>
            </AlertDialogDescription>
            {disableError && !isLegacyStorageError && (
              <div className="px-5 pb-4">
                <AlertError
                  subject="Unable to disable Warehouse"
                  showErrorPrefix={false}
                  showInstructions={false}
                  hideContactSupport
                  error={disableError}
                />
              </div>
            )}
            <div className="border-t px-5 py-4">
              <Form {...form}>
                <FormField
                  control={form.control}
                  name="shouldDeleteData"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="flex"
                      label="Also delete copied Warehouse data"
                      description="Deletes the copied data and its storage permanently. Source tables are preserved."
                    >
                      <FormControl>
                        <Checkbox
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          checked={field.value}
                          onCheckedChange={(checked) => field.onChange(checked === true)}
                          disabled={disableMutation.isPending}
                        />
                      </FormControl>
                    </FormItemLayout>
                  )}
                />
              </Form>
            </div>
            {isLegacyStorageError && (
              <div className="px-5 pb-4">
                <AlertError
                  subject="Copied data cannot be deleted"
                  showErrorPrefix={false}
                  showInstructions={false}
                  hideContactSupport
                  error={{
                    message: 'Turn this option off to disable Warehouse and keep the copied data.',
                  }}
                />
              </div>
            )}
          </AlertDialogBody>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="danger"
              loading={disableMutation.isPending}
              disabled={!projectRef}
              onClick={() => {
                return form.handleSubmit(handleDisable)()
              }}
            >
              Disable Warehouse
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageSection>
  )
}
