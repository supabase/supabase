'use client'

import { useEffect, useMemo, useState } from 'react'
import { MarketplaceItem, type MarketplaceItemFile } from 'ui-patterns/MarketplaceItem'

import {
  ItemForm,
  type ItemFile,
  type ItemFormValues,
  type ItemInfo,
  type PartnerInfo,
} from '@/components/item-form'

type ItemEditorSplitViewProps =
  | {
      mode: 'create'
      partner: PartnerInfo & { title: string }
      initialPreviewFiles?: MarketplaceItemFile[]
      initialFormValues?: Partial<ItemFormValues>
    }
  | {
      mode: 'edit'
      partner: PartnerInfo & { title: string }
      item: ItemInfo & { updated_at?: string | null }
      initialFiles: ItemFile[]
      initialPreviewFiles?: MarketplaceItemFile[]
    }

const EMPTY_PREVIEW_FILES: MarketplaceItemFile[] = []

function toPreviewFiles(initialFiles: ItemFile[]): MarketplaceItemFile[] {
  return initialFiles.map((file) => {
    const fileName = file.file_path.split('/').pop() ?? file.file_path
    return {
      id: file.id,
      name: fileName,
      description: file.file_path,
    }
  })
}

function maybeRenderLink(value: string) {
  if (!value.trim()) return 'No URL provided'

  try {
    // Guard against invalid values while the user is typing.
    const url = new URL(value)
    return (
      <a
        href={url.toString()}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2"
      >
        {value}
      </a>
    )
  } catch {
    return value
  }
}

export function ItemEditorSplitView(props: ItemEditorSplitViewProps) {
  const baseValues: ItemFormValues =
    props.mode === 'edit'
      ? {
          title: props.item.title,
          slug: props.item.slug,
          summary: props.item.summary ?? '',
          content: props.item.content ?? '',
          published: props.item.published ?? false,
          type: props.item.type === 'oauth' ? 'oauth' : 'template',
          url: props.item.url ?? '',
          documentation_url: props.item.documentation_url ?? '',
          files: [],
          template_files: [],
        }
      : {
          title: props.initialFormValues?.title ?? '',
          slug: props.initialFormValues?.slug ?? '',
          summary: props.initialFormValues?.summary ?? '',
          content: props.initialFormValues?.content ?? '',
          published: props.initialFormValues?.published ?? false,
          type: props.initialFormValues?.type === 'oauth' ? 'oauth' : 'template',
          url: props.initialFormValues?.url ?? '',
          documentation_url: props.initialFormValues?.documentation_url ?? '',
          files: [],
          template_files: [],
        }

  const [previewValues, setPreviewValues] = useState<ItemFormValues>(baseValues)
  const editInitialFiles = props.mode === 'edit' ? props.initialFiles : null
  const initialPreviewFiles = useMemo(() => {
    if (props.initialPreviewFiles) return props.initialPreviewFiles
    if (editInitialFiles) return toPreviewFiles(editInitialFiles)
    return EMPTY_PREVIEW_FILES
  }, [editInitialFiles, props.initialPreviewFiles])
  const [previewFiles, setPreviewFiles] = useState<MarketplaceItemFile[]>(initialPreviewFiles)

  useEffect(() => {
    setPreviewFiles(initialPreviewFiles)
  }, [initialPreviewFiles])

  return (
    <div className="flex h-full min-h-full min-w-0">
      <section className="max-w-xl w-full min-w-lg min-h-0 border-r flex flex-col">
        <div className="min-h-0 flex-1">
          {props.mode === 'edit' ? (
            <ItemForm
              mode="edit"
              partner={{ id: props.partner.id, slug: props.partner.slug }}
              item={props.item}
              initialFiles={props.initialFiles}
              onValuesChange={setPreviewValues}
              onPreviewFilesChange={setPreviewFiles}
            />
          ) : (
            <ItemForm
              mode="create"
              partner={{ id: props.partner.id, slug: props.partner.slug }}
              onValuesChange={setPreviewValues}
              onPreviewFilesChange={setPreviewFiles}
            />
          )}
        </div>
      </section>

      <section className="min-w-0 flex-1 h-full p-6 overflow-hidden bg-muted/50">
        <div className="rounded-lg border bg-background shadow-sm h-full flex flex-col">
          <div className="flex items-center h-10 border-b px-4 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-block size-2 rounded-full bg-red-400" />
              <span className="inline-block size-2 rounded-full bg-yellow-400" />
              <span className="inline-block size-2 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <span className="text-xs text-muted-foreground bg-muted w-3xl truncate px-3 py-0.5 rounded border font-mono">
                {previewValues.slug
                  ? `https://supabase.com/marketplace/${previewValues.slug}`
                  : 'https://example.com/listing'}
              </span>
            </div>
            {/* Filler to push center on left/right */}
            <div className="w-14" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <MarketplaceItem
              title={previewValues.title || 'Untitled item'}
              summary={previewValues.summary}
              content={previewValues.content}
              primaryActionUrl={
                previewValues.type === 'oauth'
                  ? previewValues.url
                  : props.mode === 'edit'
                    ? props.item.registry_item_url
                    : null
              }
              files={previewFiles}
              partnerName={props.partner.title}
              lastUpdatedAt={props.mode === 'edit' ? props.item.updated_at : null}
              type={previewValues.type}
              metaFields={[
                ...(previewValues.type === 'oauth'
                  ? [
                      {
                        label: 'Listing URL',
                        value: maybeRenderLink(previewValues.url ?? ''),
                      },
                    ]
                  : []),
                {
                  label: 'Documentation URL',
                  value: maybeRenderLink(previewValues.documentation_url ?? ''),
                },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
