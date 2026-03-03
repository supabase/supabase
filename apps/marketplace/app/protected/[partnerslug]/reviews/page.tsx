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

import { createClient } from '@/lib/supabase/server'

type ReviewsPageProps = {
  params: {
    partnerslug: string
  }
}

export default async function ReviewsPage({ params }: ReviewsPageProps) {
  const { partnerslug } = params
  const supabase = await createClient()

  const { data: currentPartner, error: currentPartnerError } = await supabase
    .from('partners')
    .select('id, slug, title, reviewer')
    .eq('slug', partnerslug)
    .maybeSingle()

  if (currentPartnerError || !currentPartner || !currentPartner.reviewer) {
    notFound()
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from('item_reviews')
    .select('item_id, status, item:items(id, slug, title, partner:partners(slug, title))')
    .eq('status', 'pending_review')
    .order('updated_at', { ascending: false })

  if (reviewsError) {
    throw new Error(reviewsError.message)
  }

  const reviewRows = (reviews ?? [])
    .map((review) => {
      const item = Array.isArray(review.item) ? review.item[0] : review.item
      const partner = (item?.partner as { title?: string } | null) ?? null

      if (!item?.id || !item.slug || !item.title) {
        return null
      }

      return {
        reviewId: review.item_id,
        itemId: item.id,
        itemSlug: item.slug,
        itemTitle: item.title,
        partnerTitle: partner?.title ?? 'Unknown partner',
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
            {reviewRows.length === 0 ? (
              <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
                No pending reviews right now.
              </div>
            ) : (
              <div className="rounded-lg border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
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
