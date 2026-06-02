import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AiIconAnimation,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Form,
  FormControl,
  FormField,
  Input,
  Textarea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import * as z from 'zod'

import { generatedNotebookBlocksToLayout } from '@/components/interfaces/Notebook/notebookGenerate.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useCheckOpenAIKeyQuery } from '@/data/ai/check-api-key-query'
import { useNotebookGenerateMutation } from '@/data/ai/notebook-generate-mutation'
import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { uuidv4 } from '@/lib/helpers'
import { useProfile } from '@/lib/profile'
import type { Dashboards } from '@/types'

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

const defaultNotebookContent = (): Dashboards.Content => ({
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
})

export const CreateReportModal = ({ visible, onCancel, afterSubmit }: CreateReportModal) => {
  const router = useRouter()
  const { profile } = useProfile()
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: check } = useCheckOpenAIKeyQuery()
  const isApiKeySet = !!check?.hasKey
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
      toast.success('Successfully created notebook')
      const newReportId = vars.payload.id
      router.push(`/project/${ref}/sql/notebooks/${newReportId}${preservedQueryParams}`)
      afterSubmit()
    },
    onError: (error) => {
      toast.error(`Failed to create notebook: ${error.message}`)
    },
  })

  const { mutateAsync: generateNotebook, isPending: isGenerating } = useNotebookGenerateMutation()

  const isBusy = isCreating || isGenerating

  const createNotebook = ({
    name,
    description,
    content,
  }: {
    name: string
    description: string
    content: Dashboards.Content
  }) => {
    if (!ref) return console.error('Project ref is required')
    if (!profile) return console.error('Profile is required')

    upsertContent({
      projectRef: ref,
      payload: {
        id: uuidv4(),
        type: 'report',
        name,
        description,
        visibility: 'project',
        owner_id: profile?.id,
        content,
      },
    })
  }

  const createCustomReport: SubmitHandler<CustomReport> = async ({ name, description }) => {
    createNotebook({
      name,
      description: description || '',
      content: defaultNotebookContent(),
    })
  }

  const handleGenerateNotebook = async () => {
    const description = form.getValues('description')?.trim()
    if (!description) {
      toast.error('Add a description to generate a notebook with AI')
      return
    }

    const formName = form.getValues('name')?.trim()

    try {
      const generated = await generateNotebook({
        prompt: description,
        name: formName || undefined,
        projectRef: project?.ref,
        connectionString: project?.connectionString ?? undefined,
        orgSlug: org?.slug,
      })

      const layout = generatedNotebookBlocksToLayout(generated.blocks, uuidv4)
      const name = formName || generated.suggested_name?.trim() || 'Untitled notebook'

      createNotebook({
        name,
        description,
        content: {
          ...defaultNotebookContent(),
          layout,
        },
      })
    } catch {
      // Error toast handled by mutation
    }
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
  const description = form.watch('description')
  const canGenerate = Boolean(description?.trim())

  return (
    <Dialog open={visible} onOpenChange={handleCancel}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Create a notebook</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(createCustomReport)} noValidate>
            <DialogSection>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItemLayout name="name" layout="vertical" label="Name">
                    <FormControl>
                      <Input {...field} id="name" />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogSection>
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
                        placeholder="Describe your notebook"
                        className="resize-none"
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogFooter className="gap-2 sm:justify-between">
              <Button htmlType="reset" type="default" onClick={handleCancel} disabled={isBusy}>
                Cancel
              </Button>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <ButtonTooltip
                  type="default"
                  disabled={isBusy || !canGenerate || !isApiKeySet}
                  onClick={handleGenerateNotebook}
                  tooltip={{
                    content: {
                      side: 'top',
                      text: !isApiKeySet
                        ? 'Add your "OPENAI_API_KEY" to your environment variables to use this feature.'
                        : !canGenerate
                          ? 'Describe the notebook you want to generate.'
                          : undefined,
                    },
                  }}
                >
                  <span className="flex items-center gap-1.5">
                    <AiIconAnimation size={14} loading={isGenerating} />
                    Generate with AI
                  </span>
                </ButtonTooltip>
                <Button htmlType="submit" loading={isCreating} disabled={isBusy || !isDirty}>
                  Create notebook
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
