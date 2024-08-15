import { useRouter } from 'next/router'
import toast from 'react-hot-toast'

import { useContentInsertMutation } from 'data/content/content-insert-mutation'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { uuidv4 } from 'lib/helpers'
import { Button, Form, Input, Modal } from 'ui'

type CustomReport = { name: string; description?: string }
export interface CreateReportModal {
  visible: boolean
  onCancel: () => void
  afterSubmit: () => void
}

export const CreateReportModal = ({ visible, onCancel, afterSubmit }: CreateReportModal) => {
  const router = useRouter()
  const project = useSelectedProject()
  const ref = project?.ref ?? 'default'

  const { mutate: insertReport, isLoading: isCreating } = useContentInsertMutation({
    onSuccess: (data) => {
      toast.success('Successfully created new report')
      const newReportId = data[0].id
      router.push(`/project/${ref}/reports/${newReportId}`)
      afterSubmit()
    },
    onError: (error) => {
      toast.error(`Failed to create report: ${error.message}`)
    },
  })

  async function createCustomReport({ name, description }: { name: string; description?: string }) {
    if (!ref) return

    insertReport({
      projectRef: ref,
      payload: {
        id: uuidv4(),
        type: 'report',
        name,
        description: description || '',
        visibility: 'project',
        content: {
          schema_version: 1,
          period_start: {
            time_period: '7d',
            date: '',
          },
          period_end: {
            time_period: 'today',
            date: '',
          },
          interval: '1d',
          layout: [],
        },
      },
    })
  }

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      hideFooter
      header="Create a custom report"
      size="small"
    >
      <Form
        onReset={onCancel}
        validateOnBlur
        initialValues={{ name: '', description: '' }}
        validate={(vals) => {
          const errors: Partial<CustomReport> = {}

          if (!vals.name) {
            errors.name = 'Required'
          }

          return errors
        }}
        onSubmit={(newVals) => createCustomReport(newVals)}
      >
        {() => (
          <>
            <Modal.Content className="space-y-4">
              <Input label="Name" id="name" name="name" />
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
              <Button htmlType="reset" type="default" onClick={onCancel} disabled={isCreating}>
                Cancel
              </Button>
              <Button htmlType="submit" loading={isCreating} disabled={isCreating}>
                Create report
              </Button>
            </Modal.Content>
          </>
        )}
      </Form>
    </Modal>
  )
}
