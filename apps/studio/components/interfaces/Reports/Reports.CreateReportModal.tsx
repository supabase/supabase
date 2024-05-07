import { useContentInsertMutation } from 'data/content/content-insert-mutation'
import { useSelectedProject } from 'hooks'
import { uuidv4 } from 'lib/helpers'
import { useRouter } from 'next/router'
import toast from 'react-hot-toast'
import { Button, Form, Input, Modal } from 'ui'

type CustomReport = { name: string; description?: string }
export interface CreateReportModal {
  visible: boolean
  onCancel: () => void
  afterSubmit: () => void
}

export const CreateReportModal = ({ visible, onCancel, afterSubmit }: CreateReportModal) => {
  const project = useSelectedProject()
  const insertReport = useContentInsertMutation()
  const ref = project?.ref ?? 'default'
  const router = useRouter()

  async function createCustomReport({ name, description }: { name: string; description?: string }) {
    try {
      if (!ref) return

      const res = await insertReport.mutateAsync({
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
      toast.success('New report created')
      const newReportId = res[0].id
      router.push(`/project/${ref}/reports/${newReportId}`)
      afterSubmit()
    } catch (error) {
      toast.error(`Failed to create report. Check console for more details.`)
      console.error(error)
    }
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
        {({ isSubmitting }: { isSubmitting: boolean }) => (
          <div className="space-y-4 py-4">
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
            <Modal.Content>
              <div className="flex items-center justify-end gap-2">
                <Button htmlType="reset" type="default" onClick={onCancel} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting}>
                  Create report
                </Button>
              </div>
            </Modal.Content>
          </div>
        )}
      </Form>
    </Modal>
  )
}
