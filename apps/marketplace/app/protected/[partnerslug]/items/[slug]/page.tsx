import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  BreadcrumbItem_Shadcn_ as BreadcrumbItem,
  BreadcrumbLink_Shadcn_ as BreadcrumbLink,
  BreadcrumbList_Shadcn_ as BreadcrumbList,
  BreadcrumbPage_Shadcn_ as BreadcrumbPage,
  BreadcrumbSeparator_Shadcn_ as BreadcrumbSeparator,
} from 'ui'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderBreadcrumb,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import type { MarketplaceItemFile } from 'ui-patterns/MarketplaceItem'

import { ItemEditorSplitView } from '@/components/item-editor-split-view'
import { ItemReviewPrimaryAction } from '@/components/item-review-primary-action'
import { deriveOpenReviewState } from '@/lib/marketplace/review-state'
import { createClient } from '@/lib/supabase/server'

type EditItemPageProps = {
  params: {
    partnerslug: string
    slug: string
  }
}

export default async function EditItemPage({ params }: EditItemPageProps) {
  const { partnerslug, slug } = params
  const supabase = await createClient()

  const { data: partner, error: partnerError } = await supabase
    .from('partners')
    .select('id, slug, title')
    .eq('slug', partnerslug)
    .maybeSingle()

  if (partnerError || !partner) {
    notFound()
  }

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select(
      'id, slug, title, summary, content, published, type, url, registry_item_url, documentation_url, updated_at'
    )
    .eq('partner_id', partner.id)
    .eq('slug', slug)
    .maybeSingle()

  if (itemError || !item) {
    notFound()
  }

  const { data: itemFiles, error: itemFilesError } = await supabase
    .from('item_files')
    .select('id, file_path, sort_order')
    .eq('item_id', item.id)
    .order('sort_order', { ascending: true })

  if (itemFilesError) {
    throw new Error(itemFilesError.message)
  }

  const filePaths = (itemFiles ?? []).map((file) => file.file_path)
  const { data: signedFiles } =
    filePaths.length > 0
      ? await supabase.storage.from('item_files').createSignedUrls(filePaths, 60 * 60)
      : { data: [] as { signedUrl?: string }[] }

  const { data: latestReview, error: latestReviewError } = await supabase
    .from('item_reviews')
    .select('status, review_notes')
    .eq('item_id', item.id)
    .maybeSingle()

  if (latestReviewError) {
    throw new Error(latestReviewError.message)
  }

  const { hasOpenReview, isApproved, openReviewStatusLabel } = deriveOpenReviewState(
    latestReview?.status
  )

  const previewFiles: MarketplaceItemFile[] = (itemFiles ?? []).map((file, index) => {
    const fileName = file.file_path.split('/').pop() ?? file.file_path
    return {
      id: file.id,
      name: fileName,
      href: signedFiles?.[index]?.signedUrl,
      description: file.file_path,
    }
  })

  return (
    <div className="flex h-full min-h-full min-w-0 flex-col">
      <PageHeader size="full" className="border-b pb-6 [&>div]:px-6 [&>div]:xl:px-6">
        <PageHeaderBreadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/protected/${partner.slug}/items`}>Items</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </PageHeaderBreadcrumb>
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>{item.title}</PageHeaderTitle>
          </PageHeaderSummary>
          <PageHeaderAside>
            <ItemReviewPrimaryAction
              itemId={item.id}
              itemSlug={item.slug}
              partnerSlug={partner.slug}
              isApproved={isApproved}
              hasOpenReview={hasOpenReview}
              latestReviewStatus={latestReview?.status ?? null}
              latestReviewNotes={latestReview?.review_notes ?? null}
              openReviewStatusLabel={openReviewStatusLabel}
            />
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>

      <div className="min-h-0 flex-1">
        <ItemEditorSplitView
          mode="edit"
          partner={{ id: partner.id, slug: partner.slug, title: partner.title }}
          item={item}
          initialFiles={itemFiles ?? []}
          initialPreviewFiles={previewFiles}
        />
      </div>
    </div>
  )
}
