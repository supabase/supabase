'use client'

import {
  Badge,
  Button,
  Popover_Shadcn_ as Popover,
  PopoverContent_Shadcn_ as PopoverContent,
  PopoverTrigger_Shadcn_ as PopoverTrigger,
} from 'ui'

import { requestItemReviewAction } from '@/app/protected/actions'

type ItemReviewPrimaryActionProps = {
  itemId: number
  itemSlug: string
  partnerSlug: string
  isApproved: boolean
  hasOpenReview: boolean
  latestReviewStatus?: string | null
  latestReviewNotes?: string | null
  openReviewStatusLabel?: string | null
}

export function ItemReviewPrimaryAction({
  itemId,
  itemSlug,
  partnerSlug,
  isApproved,
  hasOpenReview,
  latestReviewStatus,
  latestReviewNotes,
  openReviewStatusLabel,
}: ItemReviewPrimaryActionProps) {
  if (isApproved) {
    return <Badge variant="success">Approved</Badge>
  }

  if (latestReviewStatus === 'rejected') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Badge variant="destructive">Rejected</Badge>
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="space-y-3">
          <div className="mb-4 space-y-2">
            <p className="heading-default">Review feedback</p>
            <p className="border-l-2 pl-4 text-sm text-foreground-light whitespace-pre-wrap">
              {latestReviewNotes?.trim()
                ? latestReviewNotes
                : 'No rejection reason was provided for this review.'}
            </p>
          </div>
          <form action={requestItemReviewAction}>
            <input type="hidden" name="itemId" value={itemId} />
            <input type="hidden" name="itemSlug" value={itemSlug} />
            <input type="hidden" name="partnerSlug" value={partnerSlug} />
            <Button htmlType="submit" type="secondary" className="w-full">
              Re-request review
            </Button>
          </form>
        </PopoverContent>
      </Popover>
    )
  }

  if (hasOpenReview) {
    return openReviewStatusLabel ? (
      <Badge variant="warning">{openReviewStatusLabel}</Badge>
    ) : (
      <Badge>Review requested</Badge>
    )
  }

  return (
    <form action={requestItemReviewAction}>
      <input type="hidden" name="itemId" value={itemId} />
      <input type="hidden" name="itemSlug" value={itemSlug} />
      <input type="hidden" name="partnerSlug" value={partnerSlug} />
      <Button htmlType="submit" type="secondary">
        Request review
      </Button>
    </form>
  )
}
