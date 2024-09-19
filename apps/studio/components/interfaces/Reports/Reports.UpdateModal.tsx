import { toast } from 'sonner'

import { useParams } from 'common'
import { Content } from 'data/content/content-query'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { Button, Form, Input, Modal } from 'ui'

type CustomReport = { name: string; description?: string }

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
  const { mutate: updateReport, isLoading: isUpdating } = useContentUpsertMutation({
    onSuccess: () => {
      toast.success('Successfully updated report')
      onCancel()
    },
    onError: (error) => {
      toast.error(`Failed to update report: ${error.message}`)
    },
  })

  const onConfirmUpdateReport = (newVals: { name: string; description?: string }) => {
    if (!ref) return console.error('Project ref is required')
    if (!selectedReport) return
    if (!selectedReport.id) return
    if (!selectedReport.project_id) return

    updateReport({
      projectRef: ref,
      payload: {
        ...selectedReport,
        project_id: selectedReport.project_id,
        id: selectedReport.id,
        name: newVals.name,
        description: newVals.description || '',
      },
    })
  }

  function validate(values: CustomReport) {
    const errors: Partial<CustomReport> = {}
    if (!values.name) errors.name = 'This field is required'
    return errors
  }

  return (
    <Modal
      visible={selectedReport !== undefined}
      onCancel={onCancel}
      hideFooter
      header="Update custom report"
      size="small"
    >
      <Form
        onReset={onCancel}
        validateOnBlur
        initialValues={initialValues}
        validate={validate}
        onSubmit={onConfirmUpdateReport}
      >
        {() => (
          <>
            <Modal.Content>
              <Input label="Name" id="name" name="name" />
            </Modal.Content>
            <Modal.Content>
              <Input.TextArea
                label="Description"
                id="description"
                placeholder="Describe your custom report"
                size="medium"
                textAreaClassName="resize-none"
              />
            </Modal.Content>
            <Modal.Separator />
            <Modal.Content className="flex items-center justify-end gap-2">
              <Button htmlType="reset" type="default" onClick={onCancel} disabled={isUpdating}>
                Cancel
              </Button>
              <Button htmlType="submit" loading={isUpdating} disabled={isUpdating}>
                Save custom report
              </Button>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}
