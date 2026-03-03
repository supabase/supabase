'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  Form_Shadcn_ as Form,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  Input_Shadcn_ as Input,
  RadioGroupStacked,
  RadioGroupStackedItem,
  TextArea_Shadcn_ as TextArea,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { createItemDraftAction, updateItemDraftAction } from '@/app/protected/actions'
import { ItemFilesUploader, type ItemPreviewFile } from '@/components/item-files-uploader'

export type ItemFile = {
  id: number
  file_path: string
  sort_order: number
}

export type PartnerInfo = {
  id: number
  slug: string
}

export type ItemInfo = {
  id: number
  slug: string
  title: string
  summary: string | null
  content: string | null
  type: string
  link: string
}

type BaseProps = {
  partner: PartnerInfo
  onValuesChange?: (values: ItemFormValues) => void
  onPreviewFilesChange?: (files: ItemPreviewFile[]) => void
}

type CreateModeProps = BaseProps & {
  mode: 'create'
}

type EditModeProps = BaseProps & {
  mode: 'edit'
  item: ItemInfo
  initialFiles: ItemFile[]
}

type ItemFormProps = CreateModeProps | EditModeProps

type SubmitResult = {
  itemId: number
  itemSlug: string
  partnerSlug: string
}

const itemTypeEnum = z.enum(['template', 'oauth'])

const itemFormSchema = z.object({
  title: z.string().min(1, 'Item name is required'),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  type: itemTypeEnum,
  link: z.string().url('Enter a valid URL'),
})

export type ItemFormValues = z.infer<typeof itemFormSchema>

export function ItemForm(props: ItemFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [autoUploadSignal, setAutoUploadSignal] = useState(0)
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null)
  const [isWaitingForAutoUpload, setIsWaitingForAutoUpload] = useState(false)
  const [removedFileIds, setRemovedFileIds] = useState<number[]>([])
  const submitIntentRef = useRef<'save' | 'request_review'>('save')

  const isCreateMode = props.mode === 'create'
  const item = props.mode === 'edit' ? props.item : null
  const itemId = isCreateMode ? submitResult?.itemId : item?.id
  const initialFiles = props.mode === 'edit' ? props.initialFiles : []
  const fieldsDisabled = isPending || isWaitingForAutoUpload

  const defaultValues = useMemo<ItemFormValues>(
    () => ({
      title: item?.title ?? '',
      slug: item?.slug ?? '',
      summary: item?.summary ?? '',
      content: item?.content ?? '',
      type: item?.type === 'oauth' ? 'oauth' : 'template',
      link: item?.link ?? '',
    }),
    [item?.content, item?.link, item?.slug, item?.summary, item?.title, item?.type]
  )

  const form = useForm<ItemFormValues>({
    defaultValues,
    values: defaultValues,
  })
  const onValuesChange = props.onValuesChange
  const onPreviewFilesChange = props.onPreviewFilesChange

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  useEffect(() => {
    if (!onValuesChange) return

    onValuesChange(form.getValues())
    const subscription = form.watch((value) => {
      onValuesChange({
        title: value.title ?? '',
        slug: value.slug ?? '',
        summary: value.summary ?? '',
        content: value.content ?? '',
        type: value.type === 'oauth' ? 'oauth' : 'template',
        link: value.link ?? '',
      })
    })

    return () => subscription.unsubscribe()
  }, [form, onValuesChange])

  const onSubmit = (values: ItemFormValues) => {
    const parsed = itemFormSchema.safeParse(values)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const fieldName = issue.path[0]
        if (typeof fieldName === 'string') {
          form.setError(fieldName as keyof ItemFormValues, {
            type: 'manual',
            message: issue.message,
          })
        }
      })
      return
    }

    setError(null)
    setSuccess(null)

    const formData = new FormData()
    const intent = submitIntentRef.current
    const trimmedSlug = parsed.data.slug?.trim()

    formData.set('partnerId', String(props.partner.id))
    formData.set('partnerSlug', props.partner.slug)
    formData.set('slug', trimmedSlug ?? '')
    formData.set('summary', parsed.data.summary ?? '')
    formData.set('type', parsed.data.type)
    formData.set('link', parsed.data.link)
    formData.set('content', parsed.data.content ?? '')
    formData.set('intent', intent)

    if (isCreateMode) {
      formData.set('title', parsed.data.title)
    } else if (item) {
      formData.set('itemId', String(item.id))
      formData.set('name', parsed.data.title)
      removedFileIds.forEach((fileId) => {
        formData.append('removedFileIds[]', String(fileId))
      })
    }

    startTransition(async () => {
      try {
        const result = isCreateMode
          ? await createItemDraftAction(formData)
          : await updateItemDraftAction(formData)

        if (isCreateMode) {
          setSubmitResult(result)
          setIsWaitingForAutoUpload(true)
          setAutoUploadSignal((value) => value + 1)
          setSuccess('Item created. Finalizing file uploads...')
          return
        } else {
          setSubmitResult(result)
          setAutoUploadSignal((value) => value + 1)
          setSuccess('Item saved. File uploads started for selected files.')
        }
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : 'Unable to save item'
        setError(message)
      }
    })
  }

  const handleCancel = () => {
    form.reset(defaultValues)
    setRemovedFileIds([])
    setError(null)
    setSuccess(null)
  }

  const goToItemPage = () => {
    if (!submitResult) return
    router.push(`/protected/${submitResult.partnerSlug}/items/${submitResult.itemSlug}`)
  }

  const handleAutoUploadComplete = ({ success: uploadSuccess }: { success: boolean }) => {
    if (!isCreateMode || !submitResult || !isWaitingForAutoUpload) return

    setIsWaitingForAutoUpload(false)
    if (!uploadSuccess) {
      setError('Item created, but file upload failed. Please open the item and try again.')
      return
    }

    router.push(`/protected/${submitResult.partnerSlug}/items/${submitResult.itemSlug}`)
  }

  const titleLabel = isCreateMode ? 'Item name' : 'Item name'
  const slugLabel = isCreateMode ? 'Slug (optional)' : 'Slug'
  const isDirty = form.formState.isDirty

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="h-full w-full">
        <div className="flex h-full w-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label={titleLabel}
                    description="This name is shown to buyers in the marketplace."
                  >
                    <FormControl>
                      <Input
                        id="item-title"
                        placeholder="Authentication starter"
                        required
                        disabled={fieldsDisabled}
                        {...field}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            <div className="p-6 pt-0">
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label={slugLabel}
                    description={
                      isCreateMode
                        ? 'Leave empty to auto-generate from the item name.'
                        : 'Slug is used in the item URL and should remain unique per partner.'
                    }
                  >
                    <FormControl>
                      <Input
                        id="item-slug"
                        placeholder="authentication-starter"
                        disabled={fieldsDisabled}
                        {...field}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            <div className="p-6 pt-0">
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="Summary"
                    description="Short summary for compact marketplace placements."
                  >
                    <FormControl>
                      <TextArea
                        id="item-summary"
                        rows={3}
                        placeholder="One-sentence summary shown in cards and listings."
                        disabled={fieldsDisabled}
                        {...field}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            <div className="p-6 pt-0">
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="Content (Markdown)"
                    description={
                      isCreateMode
                        ? 'Detailed markdown shown on the listing page.'
                        : 'Write the full markdown content for this item listing.'
                    }
                  >
                    <FormControl>
                      <TextArea
                        id="item-content"
                        rows={8}
                        placeholder="## Overview"
                        disabled={fieldsDisabled}
                        {...field}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            <div className="p-6 pt-0">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="Type"
                    description={
                      isCreateMode
                        ? 'Pick the primary listing type for this item.'
                        : 'Controls where this item appears in discovery.'
                    }
                  >
                    <FormControl>
                      <RadioGroupStacked value={field.value} onValueChange={field.onChange}>
                        <RadioGroupStackedItem
                          value="template"
                          label="Template"
                          description="Best for starter projects and reusable boilerplates."
                          disabled={fieldsDisabled}
                        />
                        <RadioGroupStackedItem
                          value="oauth"
                          label="OAuth"
                          description="Best for identity or authorization integrations."
                          disabled={fieldsDisabled}
                        />
                      </RadioGroupStacked>
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            <div className="p-6 pt-0">
              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="Link"
                    description="External URL for installation docs or listing destination."
                  >
                    <FormControl>
                      <Input
                        id="item-link"
                        type="url"
                        placeholder="https://example.com"
                        required
                        disabled={fieldsDisabled}
                        {...field}
                      />
                    </FormControl>
                  </FormItemLayout>
                )}
              />
            </div>

            <div className="p-6 pt-0">
              <FormItemLayout
                layout="vertical"
                label="Files"
                description="Upload listing assets and artifacts for this item."
              >
                <div>
                  <ItemFilesUploader
                    partnerId={props.partner.id}
                    itemId={itemId}
                    initialFiles={initialFiles}
                    autoUploadSignal={autoUploadSignal}
                    showUploadAction={false}
                    disabled={fieldsDisabled}
                    onRemovedFileIdsChange={setRemovedFileIds}
                    onAutoUploadComplete={handleAutoUploadComplete}
                    onPreviewFilesChange={onPreviewFilesChange}
                  />
                </div>
              </FormItemLayout>
            </div>

            {error ? (
              <div className="p-6 pt-0">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : null}
            {success ? (
              <div className="p-6 pt-0">
                <p className="text-sm text-muted-foreground">{success}</p>
              </div>
            ) : null}
          </div>

          <div className="shrink-0 border-t p-6">
            <div className="flex justify-end gap-3">
              {isDirty && (
                <Button
                  htmlType="button"
                  type="outline"
                  onClick={handleCancel}
                  disabled={fieldsDisabled}
                >
                  Cancel
                </Button>
              )}
              {isCreateMode ? (
                <>
                  <Button
                    htmlType="submit"
                    onClick={() => {
                      submitIntentRef.current = 'save'
                    }}
                    disabled={!isDirty || isPending || isWaitingForAutoUpload}
                  >
                    {isPending || isWaitingForAutoUpload ? 'Creating...' : 'Create item'}
                  </Button>
                  {/* <Button
                    htmlType="submit"
                    type="secondary"
                    onClick={() => {
                      submitIntentRef.current = 'request_review'
                    }}
                    disabled={!isDirty || isPending || isWaitingForAutoUpload}
                  >
                    {isPending || isWaitingForAutoUpload
                      ? 'Creating...'
                      : 'Create and request review'}
                  </Button> */}
                </>
              ) : (
                <>
                  <Button htmlType="submit" disabled={!isDirty || isPending}>
                    {isPending ? 'Saving...' : 'Save changes'}
                  </Button>
                  {submitResult && submitResult.itemSlug !== item?.slug ? (
                    <Button htmlType="button" type="secondary" onClick={goToItemPage}>
                      Open updated URL
                    </Button>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      </form>
    </Form>
  )
}
