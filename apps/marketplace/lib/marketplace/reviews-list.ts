import { REVIEW_STATUSES } from '@/lib/marketplace/review-state'

export function parseReviewsFilters(searchParams?: { status?: string; itemId?: string }) {
  const requestedStatus = searchParams?.status ?? 'pending_review'
  const statusFilter =
    requestedStatus === 'all' || REVIEW_STATUSES.some((status) => status === requestedStatus)
      ? requestedStatus
      : 'pending_review'
  const itemIdFilter = searchParams?.itemId?.trim() ?? ''
  const parsedItemIdFilter = Number(itemIdFilter)
  const hasValidItemIdFilter =
    itemIdFilter.length > 0 &&
    Number.isInteger(parsedItemIdFilter) &&
    Number.isFinite(parsedItemIdFilter) &&
    parsedItemIdFilter > 0

  return {
    statusFilter,
    itemIdFilter,
    parsedItemIdFilter,
    hasValidItemIdFilter,
  }
}

export function mapReviewRows(
  reviews: Array<{
    item_id: number
    status: string | null
    item:
      | {
          id?: number | null
          slug?: string | null
          title?: string | null
          partner_id?: number | null
        }
      | Array<{
          id?: number | null
          slug?: string | null
          title?: string | null
          partner_id?: number | null
        }>
      | null
  }>,
  partnerTitleById: Map<number, string>
) {
  return reviews
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
        partnerTitle: partnerTitleById.get(item.partner_id ?? -1) ?? 'Unknown partner',
        status: review.status ?? 'pending_review',
      }
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
}
