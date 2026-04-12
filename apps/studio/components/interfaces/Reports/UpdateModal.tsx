import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  Button,
  Form_Shadcn_,
  FormControl_Shadcn_,
  FormField_Shadcn_,
  Input_Shadcn_,
  Modal,
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { Content } from '@/data/content/content-query'
import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'

const formSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
})

type CustomReport = z.infer<typeof formSchema>

export interface UpdateCustomReportProps {
  selectedReport?: Content
  initialValues: CustomReport
  onCancel: () => void
}

export const UpdateCustomReportModal = ({
  selectedReport,
  initialValues,
  onCancel,
}: UpdateCustomReportProps) => {
  const { ref } = useParams()
  const { mutate: updateReport, isPending: isUpdating } = useContentUpsertMutation({
    onSuccess: () => {
      toast.success('Successfully updated report')
      onCancel()
    },
    onError: (error) => {
      toast.error(`Failed to update report: ${error.message}`)
    },
  })

  const onConfirmUpdateReport: SubmitHandler<CustomReport> = (newVals) => {
    if (!ref) return console.error('Project ref is required')
    if (!selectedReport) return
    if (!selectedReport.id) return
    if (!selectedReport.project_id) return

    updateReport({
      projectRef: ref,
      payload: {
        ...selectedReport,
        owner_id: selectedReport.owner_id!,
        project_id: selectedReport.project_id,
        id: selectedReport.id,
        name: newVals.name,
        description: newVals.description || '',
      },
    })
  }

  const handleCancel = () => {
    onCancel()
    form.reset()
  }

  const form = useForm<CustomReport>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues,
  })
  const { formState, reset } = form
  const { isDirty } = formState

  useEffect(() => {
    if (isDirty) return
    reset(initialValues)
  }, [initialValues, isDirty, reset])

  return (
    <Modal
      visible={selectedReport !== undefined}
      onCancel={handleCancel}
      hideFooter
      header="Update custom report"
      size="small"
    >
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onConfirmUpdateReport)} noValidate>
          <Modal.Content>
            <FormField_Shadcn_
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout name="name" layout="vertical" label="Name">
                  <FormControl_Shadcn_>
                    <Input_Shadcn_ {...field} id="name" />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </Modal.Content>
          <Modal.Content>
            <FormField_Shadcn_
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItemLayout name="description" layout="vertical" label="Description">
                  <FormControl_Shadcn_>
                    <Textarea
                      {...field}
                      id="description"
                      rows={4}
                      placeholder="Describe your custom report"
                      className="resize-none"
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content className="flex items-center justify-end gap-2">
            <Button htmlType="reset" type="default" onClick={handleCancel} disabled={isUpdating}>
              Cancel
            </Button>
            <Button htmlType="submit" loading={isUpdating} disabled={isUpdating || !isDirty}>
              Save custom report
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}
