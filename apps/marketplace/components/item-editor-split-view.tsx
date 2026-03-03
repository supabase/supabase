'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, CardDescription, CardHeader, CardTitle } from 'ui'
import { MarketplaceItem, type MarketplaceItemFile } from 'ui-patterns/MarketplaceItem'

import { requestItemReviewAction } from '@/app/protected/actions'
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
      reviewRequest?: {
        itemId: number
        itemSlug: string
        partnerSlug: string
        isApproved: boolean
        hasOpenReview: boolean
        latestReviewStatus?: string | null
        openReviewStatusLabel?: string | null
      }
    }

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
          type: props.item.type === 'oauth' ? 'oauth' : 'template',
          link: props.item.link,
        }
      : {
          title: props.initialFormValues?.title ?? '',
          slug: props.initialFormValues?.slug ?? '',
          summary: props.initialFormValues?.summary ?? '',
          content: props.initialFormValues?.content ?? '',
          type: props.initialFormValues?.type === 'oauth' ? 'oauth' : 'template',
          link: props.initialFormValues?.link ?? '',
        }

  const [previewValues, setPreviewValues] = useState<ItemFormValues>(baseValues)
  const initialPreviewFiles = useMemo(() => {
    if (props.initialPreviewFiles) return props.initialPreviewFiles
    if (props.mode === 'edit') return toPreviewFiles(props.initialFiles)
    return []
  }, [props])
  const [previewFiles, setPreviewFiles] = useState<MarketplaceItemFile[]>(initialPreviewFiles)

  useEffect(() => {
    setPreviewFiles(initialPreviewFiles)
  }, [initialPreviewFiles])

  const reviewControl =
    props.mode === 'edit' && props.reviewRequest ? (
      props.reviewRequest.hasOpenReview ? (
        props.reviewRequest.isApproved ? (
          <Badge variant="success">Approved</Badge>
        ) : props.reviewRequest.latestReviewStatus === 'rejected' ? (
          <Badge variant="destructive">Rejected</Badge>
        ) : props.reviewRequest.openReviewStatusLabel ? (
          <Badge variant="warning">{props.reviewRequest.openReviewStatusLabel}</Badge>
        ) : (
          <Badge>Review requested</Badge>
        )
      ) : (
        <form action={requestItemReviewAction}>
          <input type="hidden" name="itemId" value={props.reviewRequest.itemId} />
          <input type="hidden" name="itemSlug" value={props.reviewRequest.itemSlug} />
          <input type="hidden" name="partnerSlug" value={props.reviewRequest.partnerSlug} />
          <Button htmlType="submit" type="secondary">
            Request review
          </Button>
        </form>
      )
    ) : null

  return (
    <div className="flex h-full min-h-full min-w-0">
      <section className="w-4xl min-w-2xl overflow-y-auto border-r">
        <Card className="flex h-full w-full flex-col rounded-none border-none">
          <CardHeader className="shrink-0 border-b">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>
                  {props.mode === 'create' ? 'Create a marketplace item' : 'Edit marketplace item'}
                </CardTitle>
                <CardDescription>on behalf of {props.partner.title}</CardDescription>
              </div>
              {reviewControl}
            </div>
          </CardHeader>
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
        </Card>
      </section>

      <section className="min-w-0 flex-1 h-full p-6 overflow-hidden bg-muted/20">
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
              files={previewFiles}
              partnerName={props.partner.title}
              lastUpdatedAt={props.mode === 'edit' ? props.item.updated_at : null}
              type={previewValues.type}
              metaFields={[
                {
                  label: 'Listing URL',
                  value: maybeRenderLink(previewValues.link),
                },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
