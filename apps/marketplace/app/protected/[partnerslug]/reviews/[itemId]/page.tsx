import { notFound } from 'next/navigation'
import { MarketplaceItem, type MarketplaceItemFile } from 'ui-patterns/MarketplaceItem'

import { ReviewDecisionForm } from './review-decision-form'
import { createClient } from '@/lib/supabase/server'

type ReviewDetailPageProps = {
  params: {
    partnerslug: string
    itemId: string
  }
}

export default async function ReviewDetailPage({ params }: ReviewDetailPageProps) {
  const { partnerslug, itemId } = params
  const supabase = await createClient()
  const parsedItemId = Number(itemId)

  if (!Number.isFinite(parsedItemId)) {
    notFound()
  }

  const { data: reviewerPartner, error: reviewerPartnerError } = await supabase
    .from('partners')
    .select('id, slug, title, reviewer')
    .eq('slug', partnerslug)
    .maybeSingle()

  if (reviewerPartnerError || !reviewerPartner || !reviewerPartner.reviewer) {
    notFound()
  }

  const { data: item, error: itemError } = await supabase
    .from('items')
    .select(
      'id, slug, title, summary, link, content, type, updated_at, partner:partners(id, slug, title), review:item_reviews(status, featured, review_notes, reviewed_at)'
    )
    .eq('id', parsedItemId)
    .maybeSingle()

  if (itemError || !item) {
    notFound()
  }

  const latestReview = Array.isArray(item.review) ? item.review[0] : item.review
  const latestStatus =
    latestReview?.status === 'approved' ||
    latestReview?.status === 'rejected' ||
    latestReview?.status === 'draft' ||
    latestReview?.status === 'pending_review'
      ? latestReview.status
      : 'pending_review'
  const latestFeatured = latestReview?.featured ?? false
  const latestNotes = latestReview?.review_notes ?? ''

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

  const marketplaceFiles: MarketplaceItemFile[] = (itemFiles ?? []).map((file, index) => {
    const fileName = file.file_path.split('/').pop() ?? file.file_path
    return {
      id: file.id,
      name: fileName,
      href: signedFiles?.[index]?.signedUrl,
      description: file.file_path,
    }
  })

  return (
    <div className="flex h-full min-h-full min-w-0">
      <section className="min-w-2xl w-4xl overflow-y-auto border-r">
        <ReviewDecisionForm
          partnerSlug={partnerslug}
          title={item.title}
          partnerTitle={(item.partner as { title?: string } | null)?.title ?? 'Unknown partner'}
          itemId={item.id}
          defaultValues={{
            status: latestStatus,
            featured: latestFeatured,
            reviewNotes: latestNotes,
          }}
        />
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
                {item.slug
                  ? `https://supabase.com/marketplace/${item.slug}`
                  : 'https://example.com/listing'}
              </span>
            </div>
            <div className="w-14" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <MarketplaceItem
              title={item.title || 'Untitled item'}
              summary={item.summary}
              content={item.content}
              files={marketplaceFiles}
              partnerName={(item.partner as { title?: string } | null)?.title}
              lastUpdatedAt={item.updated_at}
              type={item.type}
              metaFields={[
                {
                  label: 'Listing URL',
                  value: item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="underline underline-offset-2"
                    >
                      {item.link}
                    </a>
                  ) : (
                    'No URL provided'
                  ),
                },
              ]}
            />
          </div>
        </div>
      </section>
    </div>
  )
}
