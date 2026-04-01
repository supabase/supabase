import { zodResolver } from '@hookform/resolvers/zod'
import { useParams } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import {
  AiIconAnimation,
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

import { subscriptionHasHipaaAddon } from '../Billing/Subscription/Subscription.utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useCheckOpenAIKeyQuery } from '@/data/ai/check-api-key-query'
import { useSqlTitleGenerateMutation } from '@/data/ai/sql-title-mutation'
import { useProjectSettingsV2Query } from '@/data/config/project-settings-v2-query'
import { getContentById } from '@/data/content/content-id-query'
import {
  UpsertContentPayload,
  useContentUpsertMutation,
} from '@/data/content/content-upsert-mutation'
import { Snippet } from '@/data/content/sql-folders-query'
import type { SqlSnippet } from '@/data/content/sql-snippets-query'
import { useOrgSubscriptionQuery } from '@/data/subscriptions/org-subscription-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
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

const RenameQueryModal = ({
  snippet = {} as any,
  visible,
  onCancel,
  onComplete,
}: RenameQueryModalProps) => {
  const { ref } = useParams()
  const router = useRouter()
  const { data: organization } = useSelectedOrganizationQuery()

  const snapV2 = useSqlEditorV2StateSnapshot()
  const tabsSnap = useTabsStateSnapshot()
  const { data: subscription } = useOrgSubscriptionQuery(
    { orgSlug: organization?.slug },
    { enabled: visible }
  )
  const isSQLSnippet = snippet.type === 'sql'
  const { data: projectSettings } = useProjectSettingsV2Query({ projectRef: ref })

  // Customers on HIPAA plans should not have access to Supabase AI
  const hasHipaaAddon = subscriptionHasHipaaAddon(subscription) && projectSettings?.is_sensitive

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
      getGeneratedValues({ sql: snippet.content.sql })
    } else {
      try {
        const { content } = await getContentById({ projectRef: ref, id: snippet.id })
        if ('sql' in content) getGeneratedValues({ sql: content.sql })
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
        localSnippet = await getContentById({ projectRef: ref, id })
        snapV2.addSnippet({ projectRef: ref, snippet: localSnippet })
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
    <Modal visible={visible} onCancel={handleCancel} hideFooter header="Rename" size="small">
      <Form_Shadcn_ {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          <Modal.Content className="space-y-4">
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
            <div className="flex w-full justify-end mt-2">
              {!hasHipaaAddon && (
                <ButtonTooltip
                  type="default"
                  onClick={() => generateTitle()}
                  size="tiny"
                  disabled={isTitleGenerationLoading || !isApiKeySet}
                  tooltip={{
                    content: {
                      side: 'bottom',
                      text: isApiKeySet
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
              )}
            </div>
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
                      placeholder="Describe query"
                      className="resize-none"
                    />
                  </FormControl_Shadcn_>
                </FormItemLayout>
              )}
            />
          </Modal.Content>
          <Modal.Separator />
          <Modal.Content className="flex items-center justify-end gap-2">
            <Button htmlType="reset" type="default" onClick={handleCancel} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button htmlType="submit" loading={isSubmitting} disabled={isSubmitting || !isDirty}>
              Rename query
            </Button>
          </Modal.Content>
        </form>
      </Form_Shadcn_>
    </Modal>
  )
}

export default RenameQueryModal
