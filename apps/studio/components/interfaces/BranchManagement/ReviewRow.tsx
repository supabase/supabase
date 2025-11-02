import dayjs from 'dayjs'
import { MoreVertical, X } from 'lucide-react'
import { useRouter } from 'next/router'

import { useQueryClient } from '@tanstack/react-query'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import type { Branch } from 'data/branches/branches-query'
import { branchKeys } from 'data/branches/keys'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

interface ReviewRowProps {
  branch: Branch
}

export const ReviewRow = ({ branch }: ReviewRowProps) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { project_ref: branchRef, parent_project_ref: projectRef } = branch

  const { mutate: updateBranch, isLoading: isUpdating } = useBranchUpdateMutation({
    onSuccess: () => {
      toast.success('Branch marked as not ready for review')
      queryClient.invalidateQueries({
        queryKey: branchKeys.list(projectRef),
      })
    },
    onError: (error) => {
      toast.error(`Failed to update branch: ${error.message}`)
    },
  })

  const handleRowClick = () => {
    router.push(`/project/${branchRef}/merge`)
  }

  const handleNotReadyForReview = (e?: Event) => {
    e?.preventDefault()
    e?.stopPropagation()

    updateBranch({
      branchRef,
      projectRef,
      requestReview: false,
    })
  }

  const formattedReviewDate = branch.review_requested_at
    ? dayjs(branch.review_requested_at).format('MMM DD, YYYY HH:mm')
    : ''

  return (
    <div
      className="w-full flex items-center justify-between px-6 py-3 hover:bg-surface-100 cursor-pointer transition-colors"
      onClick={handleRowClick}
    >
      <div className="flex items-center gap-x-4">
        <div className="flex gap-4">
          <h4 className="text-sm text-foreground" title={branch.name}>
            {branch.name}
          </h4>
          <p className="text-foreground-light">{formattedReviewDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              icon={<MoreVertical />}
              className="px-1"
              onClick={(e) => e.stopPropagation()}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" side="bottom" align="end">
            <DropdownMenuItem
              className="gap-x-2"
              disabled={isUpdating}
              onClick={(e) => e.stopPropagation()}
              onSelect={handleNotReadyForReview}
            >
              <X size={14} />
              Not ready for review
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
