import { notFound } from 'next/navigation'
import type { MarketplaceItemFile } from 'ui-patterns/MarketplaceItem'

import { ItemEditorSplitView } from '@/components/item-editor-split-view'
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
    .select('id, slug, title, summary, content, type, link, updated_at')
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
    .select('status')
    .eq('item_id', item.id)
    .maybeSingle()

  if (latestReviewError) {
    throw new Error(latestReviewError.message)
  }

  const hasOpenReview =
    latestReview?.status === 'pending_review' || latestReview?.status === 'draft'
  const isApproved = latestReview?.status === 'approved'
  const openReviewStatusLabel =
    latestReview?.status === 'pending_review'
      ? 'Pending review'
      : latestReview?.status === 'draft'
        ? 'Draft'
        : null

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
    <ItemEditorSplitView
      mode="edit"
      partner={{ id: partner.id, slug: partner.slug, title: partner.title }}
      item={item}
      initialFiles={itemFiles ?? []}
      initialPreviewFiles={previewFiles}
      reviewRequest={{
        itemId: item.id,
        itemSlug: item.slug,
        partnerSlug: partner.slug,
        isApproved,
        hasOpenReview,
        latestReviewStatus: latestReview?.status ?? null,
        openReviewStatusLabel,
      }}
    />
  )
}
