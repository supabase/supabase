import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { uuidv4 } from 'lib/helpers'
import { useProfile } from 'lib/profile'
import { Button, Form, Input, Modal } from 'ui'

type CustomReport = { name: string; description?: string }
export interface CreateReportModal {
  visible: boolean
  onCancel: () => void
  afterSubmit: () => void
}

export const CreateReportModal = ({ visible, onCancel, afterSubmit }: CreateReportModal) => {
  const router = useRouter()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const ref = project?.ref ?? 'default'

  // Preserve date range query parameters when navigating to new report
  const preservedQueryParams = useMemo(() => {
    const { its, ite, isHelper, helperText } = router.query
    const params = new URLSearchParams()

    if (its && typeof its === 'string') params.set('its', its)
    if (ite && typeof ite === 'string') params.set('ite', ite)
    if (isHelper && typeof isHelper === 'string') params.set('isHelper', isHelper)
    if (helperText && typeof helperText === 'string') params.set('helperText', helperText)

    const queryString = params.toString()
    return queryString ? `?${queryString}` : ''
  }, [router.query])

  const { mutate: upsertContent, isLoading: isCreating } = useContentUpsertMutation({
    onSuccess: (_, vars) => {
      toast.success('Successfully created new report')
      const newReportId = vars.payload.id
      router.push(`/project/${ref}/reports/${newReportId}${preservedQueryParams}`)
      afterSubmit()
    },
    onError: (error) => {
      toast.error(`Failed to create report: ${error.message}`)
    },
  })

  async function createCustomReport({ name, description }: { name: string; description?: string }) {
    if (!ref) return console.error('Project ref is required')
    if (!profile) return console.error('Profile is required')

    upsertContent({
      projectRef: ref,
      payload: {
        id: uuidv4(),
        type: 'report',
        name,
        description: description || '',
        visibility: 'project',
        owner_id: profile?.id,
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
