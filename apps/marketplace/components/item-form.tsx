'use client'

import JSZip from 'jszip'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import {
  Button,
  flattenTree,
  Form_Shadcn_ as Form,
  FormControl_Shadcn_ as FormControl,
  FormField_Shadcn_ as FormField,
  Input_Shadcn_ as Input,
  RadioGroupStacked,
  RadioGroupStackedItem,
  Switch,
  TextArea_Shadcn_ as TextArea,
  TreeView,
  TreeViewItem,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { z } from 'zod'

import { createItemDraftAction, updateItemDraftAction } from '@/app/protected/actions'
import { ItemFilesUploader, type ItemPreviewFile } from '@/components/item-files-uploader'
import {
  normalizeTemplatePath,
  shouldIgnoreTemplatePath,
} from '@/lib/marketplace/template-package'
import { createClient } from '@/lib/supabase/client'

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
  published: boolean
  type: string
  url: string | null
  registry_item_url: string | null
  documentation_url: string | null
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

const EMPTY_ITEM_FILES: ItemFile[] = []

const itemTypeEnum = z.enum(['template', 'oauth'])

function areStringArraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

type TemplateTreeNode = {
  name: string
  children: TemplateTreeNode[]
  metadata?: {
    sourcePath: string
    isFile: boolean
  }
}

function getTemplatePathSegments(pathOrUrl: string) {
  const trimmed = pathOrUrl.trim()
  if (!trimmed) return []
  return trimmed.split('/').filter(Boolean)
}

function buildTemplateTree(paths: string[]) {
  const root: TemplateTreeNode[] = []

  paths.forEach((path) => {
    const segments = getTemplatePathSegments(path)
    if (segments.length === 0) return

    let cursor = root
    segments.forEach((segment, index) => {
      const isLeaf = index === segments.length - 1
      const existing = cursor.find((node) => node.name === segment)
      if (existing) {
        if (isLeaf) {
          existing.metadata = { sourcePath: path, isFile: true }
        }
        cursor = existing.children
        return
      }

      const nextNode: TemplateTreeNode = {
        name: segment,
        children: [],
        metadata: isLeaf ? { sourcePath: path, isFile: true } : { sourcePath: path, isFile: false },
      }
      cursor.push(nextNode)
      cursor = nextNode.children
    })
  })

  return root
}

const itemFormSchema = z.object({
  title: z.string().min(1, 'Item name is required'),
  slug: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().optional(),
  published: z.boolean(),
  type: itemTypeEnum,
  url: z
    .string()
    .optional()
    .refine((value) => !value || Boolean(z.string().url().safeParse(value).success), {
      message: 'Enter a valid URL',
    }),
  documentation_url: z
    .string()
    .optional()
    .refine((value) => !value || Boolean(z.string().url().safeParse(value).success), {
      message: 'Enter a valid URL',
    }),
  files: z.array(z.string()),
  template_files: z.array(z.string()),
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
  const [templateZipFile, setTemplateZipFile] = useState<File | null>(null)
  const [existingTemplateFiles, setExistingTemplateFiles] = useState<string[]>([])
  const [selectedTemplateFiles, setSelectedTemplateFiles] = useState<string[]>([])
  const [initialTemplateFilesFieldValue, setInitialTemplateFilesFieldValue] = useState<string[]>([])
  const templateZipInputRef = useRef<HTMLInputElement>(null)
  const submitIntentRef = useRef<'save' | 'request_review'>('save')
  const supabase = useMemo(() => createClient(), [])

  const isCreateMode = props.mode === 'create'
  const item = props.mode === 'edit' ? props.item : null
  const itemId = isCreateMode ? submitResult?.itemId : item?.id
  const initialFiles = props.mode === 'edit' ? props.initialFiles : EMPTY_ITEM_FILES
  const fieldsDisabled = isPending || isWaitingForAutoUpload
  const initialFilesFieldValue = useMemo(
    () =>
      initialFiles
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((file) => file.file_path),
    [initialFiles]
  )
  const defaultValues = useMemo<ItemFormValues>(
    () => ({
      title: item?.title ?? '',
      slug: item?.slug ?? '',
      summary: item?.summary ?? '',
      content: item?.content ?? '',
      published: item?.published ?? false,
      type: item?.type === 'oauth' ? 'oauth' : 'template',
      url: item?.url ?? '',
      documentation_url: item?.documentation_url ?? '',
      files: initialFilesFieldValue,
      template_files: [],
    }),
    [
      initialFilesFieldValue,
      item?.content,
      item?.documentation_url,
      item?.slug,
      item?.summary,
      item?.title,
      item?.type,
      item?.url,
    ]
  )

  const form = useForm<ItemFormValues>({
    defaultValues,
    values: defaultValues,
  })
  const onValuesChange = props.onValuesChange
  const onPreviewFilesChange = props.onPreviewFilesChange
  const handlePreviewFilesChange = useCallback(
    (files: ItemPreviewFile[]) => {
      const normalizedFiles = files
        .map((file) => file.description ?? file.name)
        .slice()
        .sort((a, b) => a.localeCompare(b))
      const normalizedInitialFiles = initialFilesFieldValue
        .slice()
        .sort((a, b) => a.localeCompare(b))

      form.setValue('files', normalizedFiles, {
        shouldDirty: !areStringArraysEqual(normalizedFiles, normalizedInitialFiles),
        shouldTouch: true,
      })
      onPreviewFilesChange?.(files)
    },
    [form, initialFilesFieldValue, onPreviewFilesChange]
  )

  useEffect(() => {
    form.reset(defaultValues)
  }, [defaultValues, form])

  useEffect(() => {
    if (isCreateMode || item?.type !== 'template' || !itemId) {
      setExistingTemplateFiles([])
      setSelectedTemplateFiles([])
      setInitialTemplateFilesFieldValue([])
      form.setValue('template_files', [], {
        shouldDirty: false,
        shouldTouch: false,
      })
      return
    }

    let isCancelled = false
    const basePath = `${props.partner.id}/items/${itemId}/template`

    const loadTemplateFiles = async () => {
      const listRecursive = async (prefix = ''): Promise<string[]> => {
        const targetPath = prefix ? `${basePath}/${prefix}` : basePath
        const { data, error } = await supabase.storage.from('item_files').list(targetPath, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' },
        })

        if (error || !data) return []

        const nested = await Promise.all(
          data.map(async (entry) => {
            const isDirectory = entry.metadata == null
            const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name
            if (isDirectory) {
              return listRecursive(nextPrefix)
            }
            return [nextPrefix]
          })
        )

        return nested.flat()
      }

      const files = await listRecursive()
      if (isCancelled) return

      setExistingTemplateFiles(files)
      setInitialTemplateFilesFieldValue(files)
      form.setValue('template_files', files, {
        shouldDirty: false,
        shouldTouch: false,
      })
    }

    void loadTemplateFiles()

    return () => {
      isCancelled = true
    }
  }, [form, isCreateMode, item?.type, itemId, props.partner.id, supabase])

  useEffect(() => {
    if (!templateZipFile) {
      setSelectedTemplateFiles([])
      return
    }

    let isCancelled = false
    const parseZip = async () => {
      const arrayBuffer = await templateZipFile.arrayBuffer()
      const zip = await JSZip.loadAsync(arrayBuffer)
      const entries = Object.values(zip.files).filter(
        (entry) => !entry.dir && !shouldIgnoreTemplatePath(entry.name)
      )
      const topLevelDirs = new Set(entries.map((entry) => entry.name.split('/')[0]).filter(Boolean))
      const rootPrefix = topLevelDirs.size === 1 ? Array.from(topLevelDirs)[0] ?? null : null
      const normalized = entries
        .map((entry) => normalizeTemplatePath(entry.name, rootPrefix))
        .filter((entry) => entry.length > 0)
        .sort((a, b) => a.localeCompare(b))

      if (isCancelled) return
      setSelectedTemplateFiles(normalized)
      form.setValue('template_files', normalized, {
        shouldDirty: true,
        shouldTouch: true,
      })
    }

    void parseZip().catch(() => {
      if (isCancelled) return
      setSelectedTemplateFiles([])
      form.setValue('template_files', [], {
        shouldDirty: true,
        shouldTouch: true,
      })
    })

    return () => {
      isCancelled = true
    }
  }, [form, templateZipFile])

  useEffect(() => {
    if (!onValuesChange) return

    onValuesChange(form.getValues())
    const subscription = form.watch((value) => {
      onValuesChange({
        title: value.title ?? '',
        slug: value.slug ?? '',
        summary: value.summary ?? '',
        content: value.content ?? '',
        published: value.published ?? false,
        type: value.type === 'oauth' ? 'oauth' : 'template',
        url: value.url ?? '',
        documentation_url: value.documentation_url ?? '',
        files: (value.files ?? []).filter((entry): entry is string => typeof entry === 'string'),
        template_files: (value.template_files ?? []).filter(
          (entry): entry is string => typeof entry === 'string'
        ),
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

    if (parsed.data.type === 'template') {
      const hasExistingRegistryFile = Boolean(item?.registry_item_url)
      if (isCreateMode && !templateZipFile) {
        setError('Upload a template ZIP package that includes registry-item.json.')
        return
      }
      if (!isCreateMode && !templateZipFile && !hasExistingRegistryFile) {
        setError('Upload a template ZIP package that includes registry-item.json.')
        return
      }
    }
    if (parsed.data.type === 'oauth' && !parsed.data.url?.trim()) {
      setError('OAuth items require a listing URL.')
      return
    }

    const formData = new FormData()
    const intent = submitIntentRef.current
    const trimmedSlug = parsed.data.slug?.trim()

    formData.set('partnerId', String(props.partner.id))
    formData.set('partnerSlug', props.partner.slug)
    formData.set('slug', trimmedSlug ?? '')
    formData.set('summary', parsed.data.summary ?? '')
    formData.set('type', parsed.data.type)
    formData.set('published', parsed.data.published ? 'true' : 'false')
    formData.set('url', parsed.data.type === 'oauth' ? parsed.data.url ?? '' : '')
    formData.set('documentationUrl', parsed.data.documentation_url ?? '')
    formData.set('content', parsed.data.content ?? '')
    formData.set('intent', intent)
    formData.set('existingRegistryItemUrl', item?.registry_item_url ?? '')
    if (templateZipFile && parsed.data.type === 'template') {
      formData.set('templateZip', templateZipFile)
    }

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
    setTemplateZipFile(null)
    setSelectedTemplateFiles([])
    if (templateZipInputRef.current) {
      templateZipInputRef.current.value = ''
    }
    form.setValue('template_files', initialTemplateFilesFieldValue, {
      shouldDirty: false,
      shouldTouch: false,
    })
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
  const itemType = form.watch('type')
  const hasExistingTemplateFiles = existingTemplateFiles.length > 0
  const templateFilesForTree =
    selectedTemplateFiles.length > 0 || templateZipFile
      ? selectedTemplateFiles
      : existingTemplateFiles
  const hasTemplateFilesForTree = templateFilesForTree.length > 0
  const templateTreeData = useMemo(
    () => flattenTree({ name: '', children: buildTemplateTree(templateFilesForTree) }),
    [templateFilesForTree]
  )

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
                name="published"
                render={({ field }) => (
                  <FormItemLayout
                    layout="flex-row-reverse"
                    label="Published"
                    description="Published items are visible to readers once the latest review is approved."
                  >
                    <FormControl className="col-span-8">
                      <Switch
                        id="item-published"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={fieldsDisabled}
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

            {itemType === 'oauth' ? (
              <div className="p-6 pt-0">
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItemLayout
                      layout="vertical"
                      label="Listing URL"
                      description="External URL for installation docs or listing destination."
                    >
                      <FormControl>
                        <Input
                          id="item-url"
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
            ) : (
              <div className="p-6 pt-0">
                <FormItemLayout
                  layout="vertical"
                  label={
                    hasExistingTemplateFiles ? (
                      <span className="inline-flex w-full items-center justify-between gap-3">
                        <span>Template package (.zip)</span>
                        <Button
                          htmlType="button"
                          type="outline"
                          disabled={fieldsDisabled}
                          className="h-6 px-2 text-xs"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            templateZipInputRef.current?.click()
                          }}
                        >
                          Replace
                        </Button>
                      </span>
                    ) : (
                      'Template package (.zip)'
                    )
                  }
                  description="Upload a zip containing registry-item.json, functions/, and schemas/."
                >
                  <Input
                    id="item-template-zip"
                    type="file"
                    accept=".zip,application/zip"
                    disabled={fieldsDisabled}
                    ref={templateZipInputRef}
                    className={hasExistingTemplateFiles ? 'sr-only' : undefined}
                    onChange={(event) => {
                      const nextFile = event.target.files?.[0]
                      setTemplateZipFile(nextFile ?? null)
                      const nextTemplateFiles = nextFile ? [] : initialTemplateFilesFieldValue
                      form.setValue('template_files', nextTemplateFiles, {
                        shouldDirty: Boolean(nextFile),
                        shouldTouch: true,
                      })
                    }}
                  />
                  {hasTemplateFilesForTree ? (
                    <div className="mt-2 rounded-md border">
                      <TreeView
                        data={templateTreeData}
                        aria-label="Template files"
                        className="w-full py-1"
                        nodeRenderer={({
                          element,
                          isBranch,
                          isExpanded,
                          getNodeProps,
                          level,
                          isSelected,
                        }) => (
                          <TreeViewItem
                            {...getNodeProps()}
                            isExpanded={isExpanded}
                            isBranch={isBranch}
                            isSelected={isSelected}
                            level={level}
                            name={element.name}
                          />
                        )}
                      />
                    </div>
                  ) : null}
                  {templateZipFile ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Selected package: {templateZipFile.name}
                    </p>
                  ) : null}
                </FormItemLayout>
              </div>
            )}

            <div className="p-6 pt-0">
              <FormField
                control={form.control}
                name="documentation_url"
                render={({ field }) => (
                  <FormItemLayout
                    layout="vertical"
                    label="Documentation URL (optional)"
                    description="Direct link to setup or API documentation for this item."
                  >
                    <FormControl>
                      <Input
                        id="item-documentation-url"
                        type="url"
                        placeholder="https://example.com/docs"
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
                    onPreviewFilesChange={handlePreviewFilesChange}
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

          <div className="shrink-0 border-t py-4 px-6">
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
