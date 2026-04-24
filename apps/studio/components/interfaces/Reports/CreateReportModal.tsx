import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Button, Form, FormControl, FormField, Input_Shadcn_, Modal, Textarea } from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { uuidv4 } from '@/lib/helpers'
import { useProfile } from '@/lib/profile'

export interface CreateReportModal {
  visible: boolean
  onCancel: () => void
  afterSubmit: () => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Required'),
  description: z.string().optional(),
})

type CustomReport = z.infer<typeof formSchema>

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

  const { mutate: upsertContent, isPending: isCreating } = useContentUpsertMutation({
    onSuccess: (_, vars) => {
      toast.success('Successfully created new report')
      const newReportId = vars.payload.id
      router.push(`/project/${ref}/observability/${newReportId}${preservedQueryParams}`)
      afterSubmit()
    },
    onError: (error) => {
      toast.error(`Failed to create report: ${error.message}`)
    },
  })

  const createCustomReport: SubmitHandler<CustomReport> = async ({ name, description }) => {
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

  const handleCancel = () => {
    onCancel()
    form.reset()
  }

  const form = useForm<CustomReport>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', description: '' },
  })
  const { isDirty } = form.formState

  return (
    <Modal
      visible={visible}
      onCancel={handleCancel}
      hideFooter
      header="Create a custom report"
      size="small"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(createCustomReport)} noValidate>
          <Modal.Content>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItemLayout name="name" layout="vertical" label="Name">
                  <FormControl>
                    <Input_Shadcn_ {...field} id="name" />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </Modal.Content>
          <Modal.Content>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItemLayout name="description" layout="vertical" label="Description">
                  <FormControl>
                    <Textarea
                      {...field}
                      id="description"
                      rows={4}
                      placeholder="Describe your custom report"
                      className="resize-none"
                    />
                  </FormControl>
                </FormItemLayout>
              )}
            />
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content className="flex items-center justify-end gap-2">
            <Button htmlType="reset" type="default" onClick={handleCancel} disabled={isCreating}>
              Cancel
            </Button>
            <Button htmlType="submit" loading={isCreating} disabled={isCreating || !isDirty}>
              Create report
            </Button>
          </Modal.Content>
        </form>
      </Form>
    </Modal>
  )
}
