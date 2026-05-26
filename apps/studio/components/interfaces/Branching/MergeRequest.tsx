import { LOCAL_STORAGE_KEYS, useParams } from 'common'
import dayjs from 'dayjs'
import { GitBranchIcon, GitMerge, MoreVertical, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useMemo } from 'react'
import { toast } from 'sonner'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns'

import { useIsPgDeltaDiffEnabled } from '../App/FeaturePreview/FeaturePreviewContext'
import { ReviewWithAI } from '../BranchManagement/ReviewWithAI'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FeaturePreviewBadge } from '@/components/ui/FeaturePreviewBadge'
import { useBranchUpdateMutation } from '@/data/branches/branch-update-mutation'
import { useBranchesQuery } from '@/data/branches/branches-query'
import { useProjectGitHubConnectionQuery } from '@/data/integrations/github-connections-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'
import { useSendEventMutation } from '@/data/telemetry/send-event-mutation'
import { useBranchMergeDiff } from '@/hooks/branches/useBranchMergeDiff'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export const MergeTitle = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const pgDeltaDiffEnabled = useIsPgDeltaDiffEnabled()

  const parentProjectRef = project?.parent_project_ref

  const { data: branches } = useBranchesQuery(
    { projectRef: parentProjectRef },
    {
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const mainBranch = branches?.find((branch) => branch.is_default)

  return (
    <div className="flex items-center gap-x-4">
      <div className="flex items-center gap-x-2">
        <span>Merge</span>

        <code className="flex items-center text-code-inline gap-x-1.5 px-2 py-1 border border-border">
          <GitBranchIcon strokeWidth={1.5} size={14} className="text-foreground-lighter" />
          {currentBranch?.name}
        </code>

        <span>into</span>

        <Link href={`/project/${mainBranch?.project_ref}`} className="font-mono inline-flex gap-4">
          <code className="flex items-center text-code-inline font-mono gap-x-1.5 px-2 py-1 border border-border">
            <Shield strokeWidth={1.5} size={14} className="text-warning" />
            {mainBranch?.name || 'main'}
          </code>
        </Link>
      </div>

      {pgDeltaDiffEnabled && (
        <FeaturePreviewBadge featureKey={LOCAL_STORAGE_KEYS.UI_PREVIEW_PG_DELTA_DIFF} />
      )}
    </div>
  )
}

export const MergeSubtitle = () => {
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const parentProjectRef = project?.parent_project_ref

  const { data: branches } = useBranchesQuery(
    { projectRef: parentProjectRef },
    {
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)

  const subtitle = useMemo(() => {
    if (!currentBranch?.created_at) return 'Branch information unavailable'

    if (!currentBranch?.review_requested_at) {
      return 'Not ready for review'
    }

    const reviewRequestedTime = dayjs(currentBranch.review_requested_at).fromNow()
    return (
      <>
        Request opened{' '}
        <TimestampInfo
          className="text-sm"
          utcTimestamp={currentBranch.review_requested_at}
          label={reviewRequestedTime}
        />
      </>
    )
  }, [currentBranch?.created_at, currentBranch?.review_requested_at])

  return <p className="text-foreground-lighter text-sm">{subtitle}</p>
}

export const MergeActions = ({
  isWorkflowRunning,
  isSubmitting,
  onSelectMerge,
}: {
  isWorkflowRunning: boolean
  isSubmitting: boolean
  onSelectMerge: () => void
}) => {
  const router = useRouter()
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { data: selectedOrg } = useSelectedOrganizationQuery()

  const { mutate: sendEvent } = useSendEventMutation()
  const { mutate: updateBranch, isPending: isUpdating } = useBranchUpdateMutation({
    onError: (error) => {
      toast.error(`Failed to update branch: ${error.message}`)
    },
  })

  const parentProjectRef = project?.parent_project_ref
  const { data: parentProject } = useProjectDetailQuery({ ref: parentProjectRef })
  const { data: ghConnection } = useProjectGitHubConnectionQuery({ ref: parentProjectRef })

  const { data: branches } = useBranchesQuery(
    { projectRef: parentProjectRef },
    {
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )
  const currentBranch = branches?.find((branch) => branch.project_ref === ref)
  const mainBranch = branches?.find((branch) => branch.is_default)

  const {
    diffContent,
    isBranchOutOfDateOverall,
    isLoading: isCombinedDiffLoading,
    hasChanges: combinedHasChanges,
  } = useBranchMergeDiff({
    currentBranchRef: ref,
    parentProjectRef,
    currentBranchConnectionString: project?.connectionString || undefined,
    parentBranchConnectionString: parentProject?.connectionString || undefined,
    currentBranchCreatedAt: currentBranch?.created_at,
  })

  const isMergeDisabled =
    !combinedHasChanges ||
    isCombinedDiffLoading ||
    isBranchOutOfDateOverall ||
    isWorkflowRunning ||
    (!!ghConnection && Boolean(mainBranch?.git_branch))

  return (
    <div className="flex items-end gap-2">
      <ReviewWithAI
        currentBranch={currentBranch}
        mainBranch={mainBranch}
        parentProjectRef={parentProjectRef}
        diffContent={diffContent}
        disabled={!currentBranch || !mainBranch || isCombinedDiffLoading}
      />
      {isMergeDisabled ? (
        <ButtonTooltip
          tooltip={{
            content: {
              side: 'bottom',
              text: !combinedHasChanges
                ? 'No changes to merge'
                : isWorkflowRunning
                  ? 'Workflow is currently running'
                  : !!ghConnection && Boolean(mainBranch?.git_branch)
                    ? 'Deploy to production from GitHub is enabled'
                    : 'Unable to merge at this time',
            },
          }}
          type="primary"
          loading={isSubmitting}
          disabled={isMergeDisabled}
          onClick={onSelectMerge}
          icon={<GitMerge size={16} strokeWidth={1.5} className="text-brand" />}
        >
          Merge branch
        </ButtonTooltip>
      ) : (
        <Button
          type="primary"
          loading={isSubmitting}
          onClick={onSelectMerge}
          icon={<GitMerge size={16} strokeWidth={1.5} className="text-brand" />}
        >
          Merge branch
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="default" loading={isUpdating} className="px-1.5" icon={<MoreVertical />} />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="bottom" align="end" className="w-52">
          <DropdownMenuItem
            className="gap-x-2"
            onClick={() => {
              if (!ref || !parentProjectRef) return
              updateBranch(
                {
                  branchRef: ref,
                  projectRef: parentProjectRef,
                  requestReview: false,
                },
                {
                  onSuccess: () => {
                    toast.success('Successfully closed merge request')
                    router.push(`/project/${project?.ref}/branches?tab=prs`)
                    sendEvent({
                      action: 'branch_close_merge_request_button_clicked',
                      groups: {
                        project: parentProjectRef ?? 'Unknown',
                        organization: selectedOrg?.slug ?? 'Unknown',
                      },
                    })
                  },
                }
              )
            }}
          >
            Close this merge request
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
