import { useParams } from 'common'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useBranchUpdateMutation } from 'data/branches/branch-update-mutation'
import { useBranchesQuery } from 'data/branches/branches-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { GitMerge } from 'lucide-react'
import { useRouter } from 'next/router'
import { toast } from 'sonner'

export const MergeRequestButton = () => {
  const { ref } = useParams()
  const router = useRouter()
  const { data: projectDetails } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()

  const projectRef = projectDetails?.parent_project_ref || ref

  const { data: branches } = useBranchesQuery({ projectRef }, { enabled: Boolean(projectDetails) })

  const { mutate: sendEvent } = useSendEventMutation()

  const { mutate: updateBranch, isPending: isUpdating } = useBranchUpdateMutation({
    onError: () => {
      toast.error(`Failed to open merge request`)
    },
  })

  const selectedBranch = branches?.find((branch) => branch.project_ref === ref)

  if (!projectRef || !selectedBranch || selectedBranch.is_default || selectedBranch.git_branch)
    return null

  const hasReviewRequested = !!selectedBranch.review_requested_at
  const buttonLabel = hasReviewRequested ? 'Review merge request' : 'Open merge request'

  const handleClick = () => {
    if (hasReviewRequested) {
      router.push(`/project/${selectedBranch.project_ref}/merge`)
    } else {
      updateBranch(
        {
          branchRef: selectedBranch.project_ref,
          projectRef,
          requestReview: true,
        },
        {
          onSuccess: () => {
            toast.success('Merge request created')
            router.push(`/project/${selectedBranch.project_ref}/merge`)
            sendEvent({
              action: 'branch_create_merge_request_button_clicked',
              properties: {
                branchType: selectedBranch.persistent ? 'persistent' : 'preview',
                origin: 'header',
              },
              groups: {
                project: projectRef ?? 'Unknown',
                organization: selectedOrg?.slug ?? 'Unknown',
              },
            })
          },
        }
      )
    }
  }

  return (
    <ButtonTooltip
      type="default"
      className="rounded-full w-[26px] h-[26px]"
      onClick={handleClick}
      loading={isUpdating}
      tooltip={{
        content: {
          text: buttonLabel,
          side: 'bottom',
          align: 'center',
        },
      }}
      icon={
        <div className="relative">
          {hasReviewRequested && (
            <span className="w-1 h-1 absolute top-0 right-0 rounded-full bg-brand" />
          )}
          <GitMerge size={16} strokeWidth={1.5} />
        </div>
      }
    />
  )
}
