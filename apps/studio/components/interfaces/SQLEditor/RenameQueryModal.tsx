import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
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

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useCheckOpenAIKeyQuery } from '@/data/ai/check-api-key-query'
import { useSqlTitleGenerateMutation } from '@/data/ai/sql-title-mutation'
import { getContentById, getSqlSnippetById } from '@/data/content/content-id-query'
import {
  UpsertContentPayload,
  useContentUpsertMutation,
} from '@/data/content/content-upsert-mutation'
import { Snippet } from '@/data/content/sql-folders-query'
import type { SqlSnippet } from '@/data/content/sql-snippets-query'
import { useOrgAiOptInLevel } from '@/hooks/misc/useOrgOptedIntoAi'
import { IS_PLATFORM } from '@/lib/constants'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'
import { createTabId, useTabsStateSnapshot } from '@/state/tabs'

export interface RenameQueryModalProps {
  snippet?: SqlSnippet | Snippet
  visible: boolean
  onCancel: () => void
  onComplete: () => void
}

const formSchema = z.object({
  name: z.string().min(1, 'Please enter a query name'),
  description: z.string().optional(),
})

export const RenameQueryModal = ({
  snippet = {} as any,
  visible,
  onCancel,
  onComplete,
}: RenameQueryModalProps) => {
  const { ref } = useParams()
  const router = useRouter()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabsSnap = useTabsStateSnapshot()
  const isSQLSnippet = snippet.type === 'sql'

  // Orgs on HIPAA plans or that have disabled AI should not have access to Supabase AI
  const { aiOptInLevel, isHipaaProjectDisallowed } = useOrgAiOptInLevel()
  const isAiOptedOut = aiOptInLevel === 'disabled'

  const { id, name, description } = snippet

  const { mutate: getGeneratedValues, isPending: isTitleGenerationLoading } =
    useSqlTitleGenerateMutation({
      onSuccess: (data) => {
        const { title, description } = data
        form.setValue('name', title, { shouldDirty: true })
        if (!form.getValues().description) {
          form.setValue('description', description, { shouldDirty: true })
        }
      },
      onError: (error) => {
        toast.error(`Failed to generate title and description: ${error.message}`)
      },
    })
  const { data: check } = useCheckOpenAIKeyQuery()
  const isApiKeySet = !!check?.hasKey

  const generateTitle = async () => {
    if ('content' in snippet && isSQLSnippet) {
      getGeneratedValues({ sql: snippet.content.unchecked_sql })
    } else {
      try {
        const { content } = await getContentById({ projectRef: ref, id: snippet.id })
        if ('unchecked_sql' in content) getGeneratedValues({ sql: content.unchecked_sql })
      } catch (error) {
        toast.error('Unable to generate title based on query contents')
      }
    }
  }

  const { mutateAsync: upsertContent } = useContentUpsertMutation()

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = async ({ name, description }) => {
    if (!ref) return console.error('Project ref is required')
    if (!id) return console.error('Snippet ID is required')

    try {
      let localSnippet = snippet

      // [Joshen] For SQL V2 - content is loaded on demand so we need to fetch the data if its not already loaded in the valtio state
      if (!('content' in localSnippet)) {
        const fetched = await getSqlSnippetById({ projectRef: ref, id })
        snapV2.addSnippet({ projectRef: ref, snippet: fetched })
        localSnippet = fetched
      }

      const changedSnippet = await upsertContent({
        projectRef: ref,
        payload: {
          ...localSnippet,
          name,
          description,
        } as UpsertContentPayload,
      })

      if (IS_PLATFORM) {
        snapV2.renameSnippet({ id, name, description })

        const tabId = createTabId('sql', { id })
        tabsSnap.updateTab(tabId, { label: name })
      } else if (changedSnippet) {
        // In self-hosted, the snippet also updates the id when renaming it. This code is to ensure the previous snippet
        // is removed, new one is added, tab state is updated and the router is updated.

        // remove the old snippet from the state without saving to API
        snapV2.removeSnippet(id, true)

        snapV2.addSnippet({ projectRef: ref, snippet: changedSnippet })

        // remove the tab for the old snippet if the snippet was open. Renaming can also happen when the tab is not open.
        const tabId = createTabId('sql', { id })
        if (tabsSnap.hasTab(tabId)) {
          tabsSnap.removeTab(tabId)
          await router.push(`/project/${ref}/sql/${changedSnippet.id}`)
        }
      }

      toast.success('Successfully renamed snippet!')
      if (onComplete) onComplete()
    } catch (error: any) {
      // [Joshen] We probably need some rollback cause all the saving is async
      toast.error(`Failed to rename snippet: ${error.message}`)
    }
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: name ?? '', description: description ?? '' },
  })
  const { reset, formState } = form
  const { isDirty, isSubmitting } = formState

  useEffect(() => {
    if (isDirty) return
    reset({ name: name ?? '', description: description ?? '' })
  }, [id, name, description, reset, isDirty])

  const handleCancel = () => {
    onCancel()
    reset()
  }

  return (
    <Dialog open={visible} onOpenChange={handleCancel}>
      <DialogContent size="small">
        <DialogHeader>
          <DialogTitle>Rename</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
            <DialogSection className="space-y-4">
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
              <div className="flex w-full justify-end mt-2">
                <ButtonTooltip
                  variant="default"
                  onClick={() => generateTitle()}
                  size="tiny"
                  disabled={
                    isTitleGenerationLoading ||
                    !isApiKeySet ||
                    isHipaaProjectDisallowed ||
                    isAiOptedOut
                  }
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: isHipaaProjectDisallowed
                        ? 'This feature is not available for HIPAA projects.'
                        : isAiOptedOut
                          ? 'Your organization has opted out of AI features.'
                          : isApiKeySet
                            ? undefined
                            : 'Add your "OPENAI_API_KEY" to your environment variables to use this feature.',
                    },
                  }}
                >
                  <div className="flex items-center gap-1">
                    <div className="scale-75">
                      <AiIconAnimation loading={isTitleGenerationLoading} />
                    </div>
                    <span>Rename with Supabase AI</span>
                  </div>
                </ButtonTooltip>
              </div>
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
                        placeholder="Describe query"
                        className="resize-none"
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </DialogSection>
            <DialogFooter>
              <Button type="reset" variant="default" onClick={handleCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting || !isDirty}>
                Rename query
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
