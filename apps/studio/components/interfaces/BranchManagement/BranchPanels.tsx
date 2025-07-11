import dayjs from 'dayjs'
import { ArrowRight, ExternalLink, GitPullRequest, Github } from 'lucide-react'
import { Button } from 'ui'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { PropsWithChildren, ReactNode } from 'react'
import { useInView } from 'react-intersection-observer'

import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useBranchQuery } from 'data/branches/branch-query'
import type { Branch } from 'data/branches/branches-query'
import WorkflowLogs from './WorkflowLogs'

interface BranchManagementSectionProps {
  header: string | ReactNode
  footer?: ReactNode
}

export const BranchManagementSection = ({
  header,
  footer,
  children,
}: PropsWithChildren<BranchManagementSectionProps>) => {
  return (
    <div className="border rounded-lg">
      <div className="bg-surface-100 shadow-sm flex justify-between items-center px-4 py-3 rounded-t-lg text-xs font-mono uppercase">
        {typeof header === 'string' ? <span>{header}</span> : header}
      </div>
      <div className="bg-surface border-t shadow-sm rounded-b-lg text-sm divide-y">{children}</div>
      {footer !== undefined && <div className="bg-surface-100 px-6 py-1 border-t">{footer}</div>}
    </div>
  )
}

export const BranchRowLoader = () => {
  return (
    <div className="flex items-center justify-between px-6 py-2.5">
      <div className="flex items-center gap-x-4">
        <ShimmeringLoader className="w-52" />
        <ShimmeringLoader className="w-52" />
      </div>
      <div className="flex items-center gap-x-4">
        <ShimmeringLoader className="w-52" />
        <ShimmeringLoader className="w-52" />
      </div>
    </div>
  )
}

export const BranchLoader = () => {
  return (
    <>
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
      <BranchRowLoader />
    </>
  )
}

interface BranchRowProps {
  repo: string
  branch: Branch
  isMain?: boolean
  generateCreatePullRequestURL?: (branchName?: string) => string
  onSelectDeleteBranch: () => void
  rowLink?: string
  external?: boolean
  /**
   * Provide a completely custom set of row actions (e.g. a dropdown menu with MoreVertical trigger).
   * When supplied, the default action dropdown is NOT rendered.
   */
  rowActions?: ReactNode
}

export const BranchRow = ({
  branch,
  isMain = false,
  repo,
  generateCreatePullRequestURL,
  onSelectDeleteBranch,
  rowLink,
  external = false,
  rowActions,
}: BranchRowProps) => {
  const { ref: projectRef } = useParams()
  const router = useRouter()

  const daysFromNow = dayjs().diff(dayjs(branch.updated_at), 'day')
  const formattedTimeFromNow = dayjs(branch.updated_at).fromNow()
  const formattedUpdatedAt = dayjs(branch.updated_at).format('DD MMM YYYY, HH:mm:ss (ZZ)')

  const createPullRequestURL =
    generateCreatePullRequestURL?.(branch.git_branch) ?? 'https://github.com'

  const { ref, inView } = useInView()
  const { data } = useBranchQuery(
    { projectRef, id: branch.id },
    {
      enabled: inView,
      refetchInterval(data) {
        if (data?.status !== 'ACTIVE_HEALTHY') {
          return 1000 * 3 // 3 seconds
        }

        return false
      },
    }
  )

  // No internal modals since actions are supplied via rowActions prop
  // No internal update/reset mutations as actions are external

  const navigateUrl = rowLink ?? `/project/${branch.project_ref}`
  const handleRowClick = () => {
    if (external) {
      window.open(navigateUrl, '_blank', 'noopener noreferrer')
    } else {
      router.push(navigateUrl)
    }
  }

  return (
    <div
      className="w-full flex items-center justify-between px-6 py-2.5 hover:bg-surface-100"
      ref={ref}
    >
      {/* Clickable label section */}
      <div className="flex items-center gap-x-3 cursor-pointer" onClick={handleRowClick}>
        {branch.git_branch && (
          <Button asChild type="default">
            <Link
              target="_blank"
              rel="noreferrer"
              passHref
              href={`https://github.com/${repo}/tree/${branch.git_branch}`}
            >
              <Github size={14} className="text-foreground-light" />
            </Link>
          </Button>
        )}
        {branch.name}
        <p className="text-xs text-foreground-lighter">
          {daysFromNow > 1 ? `Updated on ${formattedUpdatedAt}` : `Updated ${formattedTimeFromNow}`}
        </p>
      </div>
      <div className="flex items-center gap-x-8">
        {isMain ? (
          <div className="flex items-center gap-x-2">
            <WorkflowLogs
              projectRef={branch.project_ref}
              status={
                (branch.status === 'CREATING_PROJECT'
                  ? data?.status ?? branch.status
                  : branch.status) as any
              }
            />
            {/* Row actions, supplied by caller */}
            {rowActions}
          </div>
        ) : (
          <div className="flex items-center gap-x-2">
            {branch.git_branch && branch.pr_number === undefined ? (
              <Button
                asChild
                type="default"
                iconRight={<ExternalLink size={14} />}
                // standalone button
              >
                <Link
                  passHref
                  target="_blank"
                  rel="noreferrer"
                  href={createPullRequestURL}
                  onClick={(e) => e.stopPropagation()}
                >
                  Create Pull Request
                </Link>
              </Button>
            ) : branch.pr_number !== undefined ? (
              <div className="flex items-center">
                <Link
                  href={`https://github.com/${repo}/pull/${branch.pr_number}`}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-x-2 transition px-3 py-1 rounded-full bg-background-surface-400 hover:text-foreground"
                >
                  <GitPullRequest size={14} />#{branch.pr_number}
                </Link>
                <ArrowRight className="mx-1 text-foreground-light" strokeWidth={1.5} size={16} />
                <Button asChild type="default">
                  <Link
                    passHref
                    target="_blank"
                    rel="noreferer"
                    href={`http://github.com/${repo}/tree/${branch.git_branch}`}
                  >
                    {branch.git_branch}
                  </Link>
                </Button>
              </div>
            ) : null}
            <WorkflowLogs
              projectRef={branch.project_ref}
              status={
                (branch.status === 'CREATING_PROJECT'
                  ? data?.status ?? branch.status
                  : branch.status) as any
              }
            />
            {/* Row actions, supplied by caller */}
            {rowActions}
          </div>
        )}
      </div>

      {/* No internal modals when using external actions */}
    </div>
  )
}
