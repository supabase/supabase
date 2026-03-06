'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Select_Shadcn_ as Select,
  SelectContent_Shadcn_ as SelectContent,
  SelectItem_Shadcn_ as SelectItem,
  SelectTrigger_Shadcn_ as SelectTrigger,
  SelectValue_Shadcn_ as SelectValue,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'

type ReviewsFiltersProps = {
  status: string
  itemId: string
}

export function ReviewsFilters({ status, itemId }: ReviewsFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [nextStatus, setNextStatus] = useState(status)
  const [nextItemId, setNextItemId] = useState(itemId)

  useEffect(() => {
    setNextStatus(status)
    setNextItemId(itemId)
  }, [status, itemId])

  const pushFilters = (statusValue: string, itemIdValue: string) => {
    const params = new URLSearchParams(searchParams.toString())

    if (statusValue === 'pending_review') {
      params.delete('status')
    } else {
      params.set('status', statusValue)
    }

    const trimmedItemId = itemIdValue.trim()
    if (trimmedItemId.length === 0) {
      params.delete('itemId')
    } else {
      params.set('itemId', trimmedItemId)
    }

    const query = params.toString()
    router.push(query.length > 0 ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
      <Select
        value={nextStatus}
        onValueChange={(value) => {
          setNextStatus(value)
          pushFilters(value, nextItemId)
        }}
      >
        <SelectTrigger className="w-full md:w-[180px]" size="tiny">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All statuses</SelectItem>
          <SelectItem value="pending_review">Pending review</SelectItem>
          <SelectItem value="approved">Approved</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>
      <Input
        value={nextItemId}
        size="tiny"
        type="number"
        min={1}
        placeholder="Filter by item ID"
        className="w-full md:max-w-[220px]"
        onChange={(event) => {
          const value = event.target.value
          setNextItemId(value)
          pushFilters(nextStatus, value)
        }}
      />
    </div>
  )
}
