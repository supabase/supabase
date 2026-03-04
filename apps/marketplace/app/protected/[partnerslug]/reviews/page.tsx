import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'ui'
import { PageContainer } from 'ui-patterns/PageContainer'
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

import { ReviewsFilters } from './reviews-filters'
import { createClient } from '@/lib/supabase/server'

type ReviewsPageProps = {
  params: {
    partnerslug: string
  }
  searchParams?:
    | {
        status?: string
        itemId?: string
      }
    | Promise<{
        status?: string
        itemId?: string
      }>
}

const REVIEW_STATUSES = ['pending_review', 'approved', 'rejected', 'draft'] as const

export default async function ReviewsPage({ params, searchParams }: ReviewsPageProps) {
  const { partnerslug } = params
  const supabase = await createClient()
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const requestedStatus = resolvedSearchParams?.status ?? 'pending_review'
  const statusFilter =
    requestedStatus === 'all' ||
    REVIEW_STATUSES.some((status) => status === requestedStatus)
      ? requestedStatus
      : 'pending_review'
  const itemIdFilter = resolvedSearchParams?.itemId?.trim() ?? ''
  const parsedItemIdFilter = Number(itemIdFilter)
  const hasValidItemIdFilter =
    itemIdFilter.length > 0 &&
    Number.isInteger(parsedItemIdFilter) &&
    Number.isFinite(parsedItemIdFilter) &&
    parsedItemIdFilter > 0

  const { data: currentPartner, error: currentPartnerError } = await supabase
    .from('partners')
    .select('id, slug, title, reviewer')
    .eq('slug', partnerslug)
    .maybeSingle()

  if (currentPartnerError || !currentPartner || !currentPartner.reviewer) {
    notFound()
  }

  let reviewsQuery = supabase
    .from('item_reviews')
    .select('item_id, status, item:items(id, slug, title, partner_id)')
    .order('updated_at', { ascending: false })

  if (statusFilter !== 'all') {
    reviewsQuery = reviewsQuery.eq('status', statusFilter)
  }

  if (hasValidItemIdFilter) {
    reviewsQuery = reviewsQuery.eq('item_id', parsedItemIdFilter)
  }

  const { data: reviews, error: reviewsError } = await reviewsQuery

  if (reviewsError) {
    throw new Error(reviewsError.message)
  }

  const partnerIds = Array.from(
    new Set(
      (reviews ?? [])
        .map((review) => {
          const item = Array.isArray(review.item) ? review.item[0] : review.item
          return item?.partner_id
        })
        .filter((partnerId): partnerId is number => Number.isFinite(partnerId))
    )
  )

  const { data: reviewPartners, error: reviewPartnersError } =
    partnerIds.length > 0
      ? await supabase.from('partners').select('id, title').in('id', partnerIds)
      : { data: [], error: null }

  if (reviewPartnersError) {
    throw new Error(reviewPartnersError.message)
  }

  const partnerTitleById = new Map((reviewPartners ?? []).map((partner) => [partner.id, partner.title]))

  const reviewRows = (reviews ?? [])
    .map((review) => {
      const item = Array.isArray(review.item) ? review.item[0] : review.item

      if (!item?.id || !item.slug || !item.title) {
        return null
      }

      return {
        reviewId: review.item_id,
        itemId: item.id,
        itemSlug: item.slug,
        itemTitle: item.title,
        partnerTitle: partnerTitleById.get(item.partner_id) ?? 'Unknown partner',
        status: review.status ?? 'pending_review',
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)

  return (
    <>
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderSummary>
            <PageHeaderTitle>Reviews</PageHeaderTitle>
            <PageHeaderDescription>
              Pending items from all partners are listed here for reviewer partners.
            </PageHeaderDescription>
          </PageHeaderSummary>
        </PageHeaderMeta>
      </PageHeader>
      <PageContainer size="default">
        <PageSection>
          <PageSectionContent>
            <ReviewsFilters status={statusFilter} itemId={itemIdFilter} />
            {reviewRows.length === 0 ? (
              <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                {statusFilter === 'pending_review' && !hasValidItemIdFilter
                  ? 'No pending reviews right now.'
                  : 'No reviews match these filters.'}
              </div>
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Partner</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reviewRows.map((review) => (
                      <TableRow key={review.reviewId} className="group">
                        <TableCell className="p-0 text-muted-foreground">
                          <Link
                            href={`/protected/${partnerslug}/reviews/${review.itemId}`}
                            className="block px-4 py-4 group-hover:underline"
                          >
                            {review.partnerTitle}
                          </Link>
                        </TableCell>
                        <TableCell className="p-0 font-medium">
                          <Link
                            href={`/protected/${partnerslug}/reviews/${review.itemId}`}
                            className="block px-4 py-4 group-hover:underline"
                          >
                            {review.itemTitle}
                          </Link>
                        </TableCell>
                        <TableCell className="p-0 text-muted-foreground">
                          <Link
                            href={`/protected/${partnerslug}/reviews/${review.itemId}`}
                            className="block px-4 py-4 group-hover:underline"
                          >
                            /{review.itemSlug}
                          </Link>
                        </TableCell>
                        <TableCell className="p-0 text-muted-foreground">
                          <Link
                            href={`/protected/${partnerslug}/reviews/${review.itemId}`}
                            className="block px-4 py-4 capitalize group-hover:underline"
                          >
                            {review.status.replace(/_/g, ' ')}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </PageSectionContent>
        </PageSection>
      </PageContainer>
    </>
  )
}
