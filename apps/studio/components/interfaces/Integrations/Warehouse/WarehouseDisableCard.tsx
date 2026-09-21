import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Card, CardContent, Checkbox, Form, FormControl, FormField } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'
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

import { useWarehouseDisableMutation } from '@/data/warehouse/warehouse-disable-mutation'
import { useTrack } from '@/lib/telemetry/track'

const FormSchema = z.object({ deleteData: z.boolean() })
type FormValues = z.infer<typeof FormSchema>
const defaultValues: FormValues = { deleteData: false }

export const WarehouseDisableCard = () => {
  const { ref: projectRef } = useParams()
  const track = useTrack()
  const [isConfirming, setIsConfirming] = useState(false)
  const form = useForm<FormValues>({ resolver: zodResolver(FormSchema), defaultValues })
  const shouldDeleteData = useWatch({ control: form.control, name: 'deleteData' })

  const disableMutation = useWarehouseDisableMutation({
    onSuccess: () => {
      track('warehouse_disabled', {})
      setIsConfirming(false)
      form.reset()
      toast.success('Warehouse disable started')
    },
  })

  const handleDisable = ({ deleteData }: FormValues) => {
    if (!projectRef) {
      return
    }
    disableMutation.mutate({ projectRef, deleteData })
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
              description="Stops replication and disconnects Warehouse. You can also delete its stored data."
            >
              <Button variant="danger" onClick={() => setIsConfirming(true)}>
                Disable Warehouse
              </Button>
            </FormLayout>
          </CardContent>
        </Card>
      </PageSectionContent>

      <ConfirmationModal
        visible={isConfirming}
        title="Disable Warehouse"
        variant="destructive"
        confirmLabel={shouldDeleteData ? 'Disable and delete data' : 'Disable Warehouse'}
        confirmLabelLoading="Starting disable..."
        loading={disableMutation.isPending}
        disabled={!projectRef}
        onCancel={() => {
          setIsConfirming(false)
          form.reset()
        }}
        onConfirm={form.handleSubmit(handleDisable)}
      >
        <div className="space-y-4 text-sm">
          <p className="text-foreground-light">
            Disabling Warehouse stops replication and removes its pipeline, publication, catalog
            access, and foreign tables. Your source tables are kept.
          </p>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleDisable)}>
              <FormField
                control={form.control}
                name="deleteData"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex"
                    label="Delete DuckLake data"
                    description="Permanently deletes this Warehouse's catalog metadata schema and its entire Storage bucket, including all objects. This cannot be undone."
                  >
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={disableMutation.isPending}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </form>
          </Form>
          {!shouldDeleteData && (
            <p className="text-foreground-light">
              Copied data and catalog metadata will be retained.
            </p>
          )}
        </div>
      </ConfirmationModal>
    </PageSection>
  )
}
